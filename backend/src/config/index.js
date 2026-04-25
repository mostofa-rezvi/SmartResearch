const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: process.env.DOTENV_PATH || path.join(__dirname, '../../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    DATABASE_URL: Joi.string().required().description('Postgres connection URL'),
    REDIS_URL: Joi.string().required().description('Redis connection URL'),
    ELASTICSEARCH_NODE: Joi.string().required().description('Elasticsearch node URL'),
    NEO4J_URI: Joi.string().required().description('Neo4j connection URI'),
    NEO4J_AUTH: Joi.string().required().description('Neo4j auth (user/password)'),
    ML_SERVICE_URL: Joi.string().required().description('ML Service URL'),
    JWT_ACCESS_SECRET: Joi.string().required().description('JWT access secret'),
    JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh secret'),
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
    url: envVars.REDIS_URL,
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
};
