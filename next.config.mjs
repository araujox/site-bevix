import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingIncludes: {
    '/api/admin/migrate-db': [
      'node_modules/prisma/**/*',
      'node_modules/@prisma/client/**/*'
    ],
  },
};

export default nextConfig;

