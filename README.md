# s3-to-gcs-utility

Used to transfer files from a S3 bucket to a Google Cloud Storage Bucket. 

# Dependencies 
Local Redis service to mark already processed files in case a re-run is necessary.

# Usage
1. Add `.env` file to the root of the repository.
```bash
# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=

# Google
GCS_BUCKET_NAME=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```
2. Add `aiva-service-account.json` file.
3. Run:
```bash
$ npm install
$ npm run start
```