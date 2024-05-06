const { Pool } = require('pg');

const pool = new Pool({
    connectionString:"postgres://default:IXdKnqucVP52@ep-muddy-bread-a4vocy42-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
});

module.exports = {
  pool,
};