import path from 'node:path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envPath });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';
