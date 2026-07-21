const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: process.env.DOTENV_PATH || path.join(__dirname, '../../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    DATABASE_URL: Joi.string().required().description('Postgres connection URL'),
    // REDIS_URL is optional — falls back to REDIS_HOST/REDIS_PORT (see below)
    REDIS_URL: Joi.string().description('Redis connection URL'),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    ELASTICSEARCH_NODE: Joi.string().required().description('Elasticsearch node URL'),
    NEO4J_URI: Joi.string().required().description('Neo4j connection URI'),
    NEO4J_AUTH: Joi.string().required().description('Neo4j auth (user/password)'),
    ML_SERVICE_URL: Joi.string().required().description('ML Service URL'),
    JWT_ACCESS_SECRET: Joi.string().required().description('JWT access secret'),
    JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh secret'),
    S3_ENDPOINT: Joi.string().required().description('S3 endpoint URL'),
    S3_ACCESS_KEY: Joi.string().required().description('S3 access key'),
    S3_SECRET_KEY: Joi.string().required().description('S3 secret key'),
    S3_BUCKET: Joi.string().required().description('S3 bucket name'),
    S3_REGION: Joi.string().default('us-east-1'),
    S3_FORCE_PATH_STYLE: Joi.boolean().default(true),
    // Two-factor OTP login (off by default so the app is usable without SMTP)
    OTP_LOGIN_ENABLED: Joi.boolean().default(false),
    OTP_EXPIRY_MINUTES: Joi.number().default(5),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  db: {
    url: envVars.DATABASE_URL,
  },
  redis: {
    // Prefer REDIS_URL; otherwise build it from REDIS_HOST/REDIS_PORT so the
    // stack works with either style of configuration.
    url: envVars.REDIS_URL || `redis://${envVars.REDIS_HOST}:${envVars.REDIS_PORT}`,
  },
  elasticsearch: {
    node: envVars.ELASTICSEARCH_NODE,
  },
  neo4j: {
    uri: envVars.NEO4J_URI,
    auth: envVars.NEO4J_AUTH,
  },
  mlService: {
    url: envVars.ML_SERVICE_URL,
  },
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
  },
  otp: {
    loginEnabled: envVars.OTP_LOGIN_ENABLED,
    expiryMinutes: envVars.OTP_EXPIRY_MINUTES,
  },
  s3: {
    endpoint: envVars.S3_ENDPOINT,
    accessKey: envVars.S3_ACCESS_KEY,
    secretKey: envVars.S3_SECRET_KEY,
    bucket: envVars.S3_BUCKET,
    region: envVars.S3_REGION,
    forcePathStyle: envVars.S3_FORCE_PATH_STYLE,
  },
};

