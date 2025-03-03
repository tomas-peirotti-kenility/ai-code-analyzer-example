require('dotenv').config();
const path = require('path');

module.exports = {
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-west-2'
    },
    google: {
        // Path to service account key file
        keyFilename: path.join(__dirname, 'aiva-service-account.json'),
        // The name of your Google Cloud Storage bucket
        bucketName: process.env.GCS_BUCKET_NAME
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
    },
    transfer: {
        sourceBucket: process.env.S3_BUCKET_NAME,
        prefix: process.env.S3_PREFIX || ''
    }
};