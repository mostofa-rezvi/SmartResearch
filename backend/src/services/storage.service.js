const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const config = require('../config');

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

module.exports = {
  s3Client,
  uploadFile,
};
