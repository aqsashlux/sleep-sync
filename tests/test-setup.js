/**
 * Test setup helper.
 * Provides an in-memory SQLite database for isolated, fast tests.
 *
 * Strategy: We override config.DB_PATH to ':memory:' BEFORE importing
 * initDatabase, so the production module creates an in-memory instance.
 * Each call to setupTestDB() re-initializes a fresh database.
 */

import { config } from '../config.js';

// Override DB_PATH to use in-memory SQLite for tests
config.DB_PATH = ':memory:';

// Also set a deterministic JWT_SECRET for auth tests
config.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Now import database functions — they will use the overridden config
import { initDatabase, getDB } from '../db/database.js';

/**
 * Initializes a fresh in-memory database with the schema applied.
 * Call this in beforeEach / before each test suite to get isolation.
 * Returns the raw better-sqlite3 instance for direct assertions.
 */
export const setupTestDB = () => {
    const db = initDatabase();
    return db;
};

/**
 * Cleans all rows from every table, preserving schema.
 * Useful between tests within the same suite.
 */
export const cleanTables = () => {
    const db = getDB();
    db.exec('DELETE FROM advance_checks');
    db.exec('DELETE FROM day_overrides');
    db.exec('DELETE FROM sleep_settings');
    db.exec('DELETE FROM users');
};

export { getDB };
