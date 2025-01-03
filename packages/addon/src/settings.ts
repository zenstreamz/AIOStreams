import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
} catch (error) {
  console.error('Error loading .env file');
}


class Settings {
    public static readonly PORT = process.env.PORT || 3000;
    public static readonly SECRET_KEY = process.env.SECRET_KEY;
    public static readonly COMET_URL = process.env.COMET_URL || 'https://comet.elfhosted.com/';
    public static readonly MEDIAFUSION_URL = process.env.MEDIAFUSION_URL || 'https://mediafusion.elfhosted.com/';
}


export default Settings;
