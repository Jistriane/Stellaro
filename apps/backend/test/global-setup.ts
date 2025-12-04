import path from 'node:path';
import dotenv from 'dotenv';

export default async (): Promise<void> => {
  const envPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: envPath });
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
};
