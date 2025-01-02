import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class Settings {
    public static readonly PORT = process.env.PORT || 3000;
    public static readonly SECRET_KEY = process.env.SECRET_KEY;
}

export default Settings;
