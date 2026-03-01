import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
    PORT: process.env.PORT || 3001,
    DB_PATH: path.join(__dirname, 'db', 'sync.db'),
    LEGACY_DB_PATH: path.join(__dirname, 'db.json'),

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || (() => {
        console.error('ADVERTENCIA: JWT_SECRET no esta configurado. Se genero uno temporal.');
        console.error('Configura JWT_SECRET en .env para sesiones persistentes entre reinicios.');
        return crypto.randomBytes(32).toString('hex');
    })(),
    JWT_EXPIRES_IN: '7d',
};
