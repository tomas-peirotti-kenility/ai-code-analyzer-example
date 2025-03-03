const S3ToGCSTransfer = require('./transfer');
const config = require('./config');

async function main() {
    const transfer = new S3ToGCSTransfer(
        config.aws,
        config.google,
        config.redis
    );

    try {
        console.log('Starting file transfer...');

        const results = await transfer.transferFiles(
            config.transfer.sourceBucket,
            config.transfer.prefix,
            false // Force update
        );

        if (results.failed.length > 0) {
            console.log('\nFailed transfers:');
            results.failed.forEach(file => {
                console.log(`- ${file.fileName}: ${file.error}`);
            });
        }

        console.log('\nAccess your files:');
        console.log(results.bucketInfo.url);

        // Clean up Redis connection
        await transfer.cleanup();
    } catch (error) {
        console.error('Transfer failed:', error);
        await transfer.cleanup();
        process.exit(1);
    }
}

main();