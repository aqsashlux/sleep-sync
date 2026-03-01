import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export const getDB = () => {
    if (!db) throw new Error('Database not initialized');
    return db;
};

export const initDatabase = () => {
    const dbDir = path.dirname(config.DB_PATH);
    fs.mkdirSync(dbDir, { recursive: true });

    db = new Database(config.DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);

    return db;
};
