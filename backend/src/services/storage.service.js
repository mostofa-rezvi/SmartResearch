const { S3Client, CreateBucketCommand, HeadBucketCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const config = require('../config');
const logger = require('../utils/logger');

const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

/**
 * Ensure the bucket exists, create it if not.
 */
const initStorage = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
      logger.info(`S3 Bucket "${config.s3.bucket}" created successfully`);
    } else {
      logger.error('S3 Storage initialization failed:', error);
    }
  }
};

/**
 * Upload a file to S3/MinIO
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder in bucket
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadFile = async (file, folder = 'avatars') => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.s3.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    },
  });

  await upload.done();

  // Return the URL. In MinIO local, it might need to be rewritten if accessed from outside docker,
  // but for now we'll return the internal/configured endpoint based URL.
  return `${config.s3.endpoint}/${config.s3.bucket}/${fileName}`;
};

/**
 * Fetch an object as a readable stream for download/proxy.
 * (MinIO's internal endpoint isn't browser-reachable, so files are served
 *  through the backend instead of a direct URL.)
 * @param {string} key - object key within the bucket
 * @returns {Promise<{ body: any, contentType?: string, contentLength?: number }>}
 */
const getObjectStream = async (key) => {
  const res = await s3Client.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }));
  return { body: res.Body, contentType: res.ContentType, contentLength: res.ContentLength };
};

module.exports = {
  s3Client,
  initStorage,
  uploadFile,
  getObjectStream,
};
