import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
} catch (error) {
  console.error('Error loading .env file:', error);
}


export class Settings {
  public static readonly PORT = process.env.PORT ? process.env.PORT : 3000;
  public static readonly BRANDING = process.env.NEXT_PUBLIC_ELFHOSTED_BRANDING;
  public static readonly SECRET_KEY = process.env.SECRET_KEY ?? '';
  public static readonly COMET_URL = process.env.COMET_URL ?? 'https://comet.elfhosted.com/';
  public static readonly MEDIAFUSION_URL = process.env.MEDIAFUSION_URL ?? 'https://mediafusion.elfhosted.com/';
  public static readonly MAX_ADDONS = process.env.MAX_ADDONS ? parseInt(process.env.MAX_ADDONS) : 15;
  public static readonly MAX_MOVIE_SIZE = process.env.MAX_MOVIE_SIZE ? parseInt(process.env.MAX_MOVIE_SIZE) : 150000000000; // 150GB
  public static readonly MAX_EPISODE_SIZE = process.env.MAX_EPISODE_SIZE ? parseInt(process.env.MAX_EPISODE_SIZE) : 15000000000; // 15GB
  public static readonly MAX_TIMEOUT = process.env.MAX_TIMEOUT ? parseInt(process.env.MAX_TIMEOUT) : 40000;
  public static readonly MIN_TIMEOUT = process.env.MIN_TIMEOUT ? parseInt(process.env.MIN_TIMEOUT) : 1000;
  public static readonly SHOW_DIE = process.env.SHOW_DIE ? process.env.SHOW_DIE === 'true' : true;
}


