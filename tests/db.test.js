/**
 * Tests for db/database.js
 *
 * Verifies that initDatabase() creates all expected tables with the
 * correct schema, columns, constraints, and indexes using an in-memory
 * SQLite instance.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDB } from './test-setup.js';

describe('Database initialization (initDatabase)', () => {
    let db;

    before(() => {
        db = setupTestDB();
    });

    it('should return a valid database instance', () => {
        assert.ok(db, 'initDatabase() should return a database instance');
        assert.strictEqual(typeof db.prepare, 'function', 'DB should have a prepare method');
    });

    it('should create the users table', () => {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        ).all();
        assert.strictEqual(tables.length, 1, 'users table should exist');
    });

    it('should create the sleep_settings table', () => {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sleep_settings'"
        ).all();
        assert.strictEqual(tables.length, 1, 'sleep_settings table should exist');
    });

    it('should create the day_overrides table', () => {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='day_overrides'"
        ).all();
        assert.strictEqual(tables.length, 1, 'day_overrides table should exist');
    });

    it('should create the advance_checks table', () => {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='advance_checks'"
        ).all();
        assert.strictEqual(tables.length, 1, 'advance_checks table should exist');
    });

    it('should create exactly 4 application tables', () => {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).all();
        assert.strictEqual(tables.length, 4, 'Should have exactly 4 tables');
        const names = tables.map(t => t.name).sort();
        assert.deepStrictEqual(names, [
            'advance_checks', 'day_overrides', 'sleep_settings', 'users'
        ]);
    });

    // ---- users table schema ----

    it('should have correct columns in users table', () => {
        const columns = db.prepare("PRAGMA table_info('users')").all();
        const columnNames = columns.map(c => c.name).sort();
        assert.deepStrictEqual(columnNames, [
            'avatar_url', 'created_at', 'display_name', 'email',
            'google_id', 'id', 'updated_at'
        ]);
    });

    it('should have id as primary key in users table', () => {
        const columns = db.prepare("PRAGMA table_info('users')").all();
        const pk = columns.find(c => c.name === 'id');
        assert.ok(pk, 'id column should exist');
        assert.strictEqual(pk.pk, 1, 'id should be the primary key');
    });

    it('should enforce UNIQUE on users.google_id', () => {
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'a@test.com', 'A')
        `).run();

        assert.throws(() => {
            db.prepare(`
                INSERT INTO users (id, google_id, email, display_name)
                VALUES ('u2', 'g1', 'b@test.com', 'B')
            `).run();
        }, /UNIQUE constraint failed/, 'Duplicate google_id should throw');

        // Cleanup
        db.prepare("DELETE FROM users").run();
    });

    it('should enforce UNIQUE on users.email', () => {
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'same@test.com', 'A')
        `).run();

        assert.throws(() => {
            db.prepare(`
                INSERT INTO users (id, google_id, email, display_name)
                VALUES ('u2', 'g2', 'same@test.com', 'B')
            `).run();
        }, /UNIQUE constraint failed/, 'Duplicate email should throw');

        db.prepare("DELETE FROM users").run();
    });

    // ---- sleep_settings table schema ----

    it('should have correct columns in sleep_settings table', () => {
        const columns = db.prepare("PRAGMA table_info('sleep_settings')").all();
        const columnNames = columns.map(c => c.name).sort();
        assert.deepStrictEqual(columnNames, [
            'consolidation_days', 'created_at', 'desired_sleep_hours',
            'goal_sleep', 'goal_wake', 'id', 'initial_sleep', 'initial_wake',
            'revision', 'schema_version', 'shift_amount', 'start_date',
            'updated_at', 'user_id'
        ]);
    });

    it('should enforce UNIQUE on sleep_settings.user_id', () => {
        // Create a user first
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'a@test.com', 'A')
        `).run();

        db.prepare(`
            INSERT INTO sleep_settings (id, user_id, start_date)
            VALUES ('s1', 'u1', '2025-01-01')
        `).run();

        assert.throws(() => {
            db.prepare(`
                INSERT INTO sleep_settings (id, user_id, start_date)
                VALUES ('s2', 'u1', '2025-01-02')
            `).run();
        }, /UNIQUE constraint failed/, 'Duplicate user_id in sleep_settings should throw');

        db.prepare("DELETE FROM sleep_settings").run();
        db.prepare("DELETE FROM users").run();
    });

    // ---- day_overrides table schema ----

    it('should have correct columns in day_overrides table', () => {
        const columns = db.prepare("PRAGMA table_info('day_overrides')").all();
        const columnNames = columns.map(c => c.name).sort();
        assert.deepStrictEqual(columnNames, [
            'action', 'created_at', 'date_key', 'id', 'user_id'
        ]);
    });

    it('should enforce CHECK constraint on day_overrides.action', () => {
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'a@test.com', 'A')
        `).run();

        // Valid actions should work
        db.prepare(`
            INSERT INTO day_overrides (id, user_id, date_key, action)
            VALUES ('o1', 'u1', '2025-01-01', 'hold')
        `).run();
        db.prepare(`
            INSERT INTO day_overrides (id, user_id, date_key, action)
            VALUES ('o2', 'u1', '2025-01-02', 'advance')
        `).run();

        // Invalid action should throw
        assert.throws(() => {
            db.prepare(`
                INSERT INTO day_overrides (id, user_id, date_key, action)
                VALUES ('o3', 'u1', '2025-01-03', 'invalid')
            `).run();
        }, /CHECK constraint failed/, 'Invalid action should throw CHECK constraint error');

        db.prepare("DELETE FROM day_overrides").run();
        db.prepare("DELETE FROM users").run();
    });

    it('should enforce UNIQUE(user_id, date_key) on day_overrides', () => {
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'a@test.com', 'A')
        `).run();
        db.prepare(`
            INSERT INTO day_overrides (id, user_id, date_key, action)
            VALUES ('o1', 'u1', '2025-01-01', 'hold')
        `).run();

        assert.throws(() => {
            db.prepare(`
                INSERT INTO day_overrides (id, user_id, date_key, action)
                VALUES ('o2', 'u1', '2025-01-01', 'advance')
            `).run();
        }, /UNIQUE constraint failed/, 'Duplicate (user_id, date_key) should throw');

        db.prepare("DELETE FROM day_overrides").run();
        db.prepare("DELETE FROM users").run();
    });

    // ---- advance_checks table schema ----

    it('should have correct columns in advance_checks table', () => {
        const columns = db.prepare("PRAGMA table_info('advance_checks')").all();
        const columnNames = columns.map(c => c.name).sort();
        assert.deepStrictEqual(columnNames, [
            'checked', 'created_at', 'date_key', 'id', 'user_id'
        ]);
    });

    it('should enforce UNIQUE(user_id, date_key) on advance_checks', () => {
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES ('u1', 'g1', 'a@test.com', 'A')
        `).run();
        db.prepare(`
            INSERT INTO advance_checks (id, user_id, date_key, checked)
            VALUES ('c1', 'u1', '2025-01-01', 1)
        `).run();

        assert.throws(() => {
            db.prepare(`
                INSERT INTO advance_checks (id, user_id, date_key, checked)
                VALUES ('c2', 'u1', '2025-01-01', 0)
            `).run();
        }, /UNIQUE constraint failed/, 'Duplicate (user_id, date_key) should throw');

        db.prepare("DELETE FROM advance_checks").run();
        db.prepare("DELETE FROM users").run();
    });

    // ---- Indexes ----

    it('should create indexes on user_id foreign keys', () => {
        const indexes = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
        ).all();
        const indexNames = indexes.map(i => i.name).sort();
        assert.deepStrictEqual(indexNames, [
            'idx_advance_checks_user',
            'idx_day_overrides_user',
            'idx_sleep_settings_user',
        ]);
    });
});
