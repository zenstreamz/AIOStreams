import type { NextConfig } from 'next';
import dotenv from 'dotenv';

import path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ELFHOSTED_BRANDING: process.env.NEXT_PUBLIC_ELFHOSTED_BRANDING,
  }
};

export default nextConfig;
