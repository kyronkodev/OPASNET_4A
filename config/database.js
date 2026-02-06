const { Pool } = require('pg');
const loadEnv = require('../config/env');
// 환경변수 로드
loadEnv();

// PostgreSQL pool configuration
const postgresConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_DATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create PostgreSQL pool
const postgresPool = new Pool(postgresConfig);

exports.postgresPool = postgresPool;
