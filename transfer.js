const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Storage } = require('@google-cloud/storage');
const Redis = require('ioredis');
const crypto = require('crypto');

class S3ToGCSTransfer {
    constructor(awsConfig, googleConfig, redisConfig) {
        // Initialize AWS S3 client
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey,
            },
            region: awsConfig.region
        });

        // Initialize Google Cloud Storage client
        this.storage = new Storage({
            keyFilename: googleConfig.keyFilename
        });
        this.gcsBucket = this.storage.bucket(googleConfig.bucketName);

        // Initialize Redis client
        this.redis = new Redis(redisConfig);
        this.redisKeyPrefix = 's3_gcs_transfer:';
    }

    generateFileId(bucketName, fileKey, lastModified) {
        const data = `${bucketName}:${fileKey}:${lastModified}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    async isFileUploaded(fileId) {
        const result = await this.redis.get(this.redisKeyPrefix + fileId);
        return result !== null;
    }

    async markFileAsUploaded(fileId, metadata) {
        await this.redis.set(
            this.redisKeyPrefix + fileId,
            JSON.stringify(metadata),
            'EX',
            60 * 60 * 24 * 30  // Store for 30 days
        );
    }

    async getUploadedFiles() {
        const keys = await this.redis.keys(this.redisKeyPrefix + '*');
        const files = await Promise.all(
            keys.map(async (key) => {
                const data = await this.redis.get(key);
                return {
                    fileId: key.replace(this.redisKeyPrefix, ''),
                    ...JSON.parse(data)
                };
            })
        );
        return files;
    }

    async listS3Files(bucketName, prefix = '') {
        try {
            let allFiles = [];
            let continuationToken = undefined;

            do {
                const command = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix,
                    ContinuationToken: continuationToken
                });

                const response = await this.s3Client.send(command);

                if (response.Contents) {
                    allFiles = allFiles.concat(response.Contents);
                }

                continuationToken = response.NextContinuationToken;

                if (continuationToken) {
                    console.log(`Retrieved ${allFiles.length} files so far...`);
                }

            } while (continuationToken);

            console.log(`Total files found in bucket: ${allFiles.length}`);
            return allFiles;
        } catch (error) {
            console.error('Error listing S3 files:', error);
            throw error;
        }
    }

    async uploadToGCS(s3Stream, destinationPath) {
        try {
            const file = this.gcsBucket.file(destinationPath);

            // Create write stream to GCS
            const writeStream = file.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: 'application/octet-stream'
                }
            });

            // Handle the stream
            for await (const chunk of s3Stream) {
                writeStream.write(chunk);
            }

            // End the write stream
            writeStream.end();

            // Wait for the upload to complete
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => resolve());
                writeStream.on('error', reject);
            });
        } catch (error) {
            console.error('Error uploading to Google Cloud Storage:', error);
            throw error;
        }
    }

    async makePublic(filePath) {
        try {
            await this.gcsBucket.file(filePath).makePublic();
            return `https://storage.googleapis.com/${this.gcsBucket.name}/${filePath}`;
        } catch (error) {
            console.error('Error making file public:', error);
            throw error;
        }
    }

    async transferFiles(sourceBucket, prefix = '', forceUpdate = false) {
        try {
            console.log('Transfer destination:');
            console.log(`- GCS Bucket: ${this.gcsBucket.name}`);
            console.log('-----------------------------------');

            // List all files in S3 bucket
            const files = await this.listS3Files(sourceBucket, prefix);

            const results = {
                transferred: [],
                skipped: [],
                failed: [],
                bucketInfo: {
                    name: this.gcsBucket.name,
                    url: `https://storage.googleapis.com/${this.gcsBucket.name}`
                }
            };

            // Transfer each file
            for (const file of files) {
                if (file.Size === 0) continue; // Skip empty files or folders

                const fileId = this.generateFileId(sourceBucket, file.Key, file.LastModified);

                // Check if file was already uploaded
                if (!forceUpdate && await this.isFileUploaded(fileId)) {
                    console.log(`Skipping already uploaded file: ${file.Key}`);
                    results.skipped.push({
                        fileName: file.Key.split('/').pop(),
                        s3Path: file.Key,
                        fileId
                    });
                    continue;
                }

                try {
                    console.log(`Transferring: ${file.Key}`);

                    // Get file stream from S3
                    const s3Stream = await this.s3Client.send(new GetObjectCommand({
                        Bucket: sourceBucket,
                        Key: file.Key
                    }));

                    // Upload to Google Cloud Storage
                    await this.uploadToGCS(s3Stream.Body, file.Key);

                    // Make the file public and get its URL
                    // const publicUrl = await this.makePublic(file.Key);
                    const publicUrl = 'publicUrl'

                    // Store upload information in Redis
                    const metadata = {
                        fileName: file.Key.split('/').pop(),
                        s3Path: file.Key,
                        gcsPath: file.Key,
                        publicUrl,
                        uploadedAt: new Date().toISOString(),
                        sourceBucket,
                        size: file.Size,
                        gcsBucket: this.gcsBucket.name
                    };

                    await this.markFileAsUploaded(fileId, metadata);

                    results.transferred.push({
                        ...metadata,
                        fileId
                    });
                } catch (error) {
                    console.error(`Failed to transfer file ${file.Key}:`, error);
                    results.failed.push({
                        fileName: file.Key.split('/').pop(),
                        s3Path: file.Key,
                        fileId,
                        error: error.message
                    });
                }
            }

            // Print final summary
            console.log('\nTransfer Summary:');
            console.log('-----------------------------------');
            console.log(`Total files processed: ${files.length}`);
            console.log(`Successfully transferred: ${results.transferred.length}`);
            console.log(`Skipped (already uploaded): ${results.skipped.length}`);
            console.log(`Failed: ${results.failed.length}`);
            console.log(`\nBucket URL: ${results.bucketInfo.url}`);

            return results;
        } catch (error) {
            console.error('Error in transfer process:', error);
            throw error;
        }
    }

    async cleanup() {
        await this.redis.quit();
    }
}

module.exports = S3ToGCSTransfer;