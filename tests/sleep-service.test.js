/**
 * Tests for services/sleep-service.js
 *
 * Validates CRUD operations for sleep settings, day overrides, and
 * advance checks using an in-memory SQLite database.
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDB, cleanTables, getDB } from './test-setup.js';
import {
    getSettingsForUser,
    upsertSettingsForUser,
    getOverridesForUser,
    setOverrideForUser,
    getAdvanceChecksForUser,
    setAdvanceCheckForUser,
} from '../services/sleep-service.js';
import { findOrCreateUserByGoogle } from '../services/user-service.js';

/** Helper: create a test user and return its id */
const createTestUser = (suffix = '1') => {
    const user = findOrCreateUserByGoogle({
        googleId: `google-test-${suffix}`,
        email: `test-${suffix}@example.com`,
        displayName: `Test User ${suffix}`,
        avatarUrl: null,
    });
    return user.id;
};

/** Default valid settings payload */
const defaultSettings = {
    schemaVersion: 3,
    initialSleep: '03:00',
    initialWake: '11:00',
    goalSleep: '23:00',
    goalWake: '07:00',
    desiredSleepHours: 8,
    shiftAmount: 30,
    consolidationDays: 2,
    startDate: '2025-06-01',
    revision: 1,
};

describe('SleepService', () => {
    before(() => {
        setupTestDB();
    });

    beforeEach(() => {
        cleanTables();
    });

    // ---- getSettingsForUser ----

    describe('getSettingsForUser', () => {
        it('should return undefined/null for a user without settings', () => {
            const userId = createTestUser('no-settings');
            const result = getSettingsForUser(userId);
            // better-sqlite3 .get() returns undefined when no row found
            assert.ok(
                result === null || result === undefined,
                `Expected null or undefined, got: ${JSON.stringify(result)}`
            );
        });
    });

    // ---- upsertSettingsForUser: create ----

    describe('upsertSettingsForUser — create new settings', () => {
        it('should create settings for a user without existing settings', () => {
            const userId = createTestUser('create-settings');
            upsertSettingsForUser(userId, defaultSettings);
            const result = getSettingsForUser(userId);

            assert.ok(result, 'Should return the created settings');
            assert.strictEqual(result.user_id, userId);
            assert.strictEqual(result.initial_sleep, '03:00');
            assert.strictEqual(result.initial_wake, '11:00');
            assert.strictEqual(result.goal_sleep, '23:00');
            assert.strictEqual(result.goal_wake, '07:00');
            assert.strictEqual(result.desired_sleep_hours, 8);
            assert.strictEqual(result.shift_amount, 30);
            assert.strictEqual(result.consolidation_days, 2);
            assert.strictEqual(result.start_date, '2025-06-01');
            assert.strictEqual(result.revision, 1);
            assert.strictEqual(result.schema_version, 3);
        });

        it('should generate a UUID for the settings id', () => {
            const userId = createTestUser('uuid-settings');
            upsertSettingsForUser(userId, defaultSettings);
            const result = getSettingsForUser(userId);

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            assert.match(result.id, uuidRegex, 'Settings id should be a valid UUID');
        });

        it('should be retrievable via getSettingsForUser after creation', () => {
            const userId = createTestUser('retrieve-settings');
            upsertSettingsForUser(userId, defaultSettings);

            const fetched = getSettingsForUser(userId);
            assert.ok(fetched, 'Should retrieve settings after upsert');
            assert.strictEqual(fetched.initial_sleep, '03:00');
            assert.strictEqual(fetched.revision, 1);
        });
    });

    // ---- upsertSettingsForUser: update ----

    describe('upsertSettingsForUser — update existing settings', () => {
        it('should update settings when they already exist', () => {
            const userId = createTestUser('update-settings');

            // Create initial settings
            upsertSettingsForUser(userId, defaultSettings);

            // Update with new values
            upsertSettingsForUser(userId, {
                ...defaultSettings,
                initialSleep: '01:00',
                initialWake: '09:00',
                shiftAmount: 45,
                revision: 2,
            });
            const updated = getSettingsForUser(userId);

            assert.ok(updated, 'Should return the updated settings');
            assert.strictEqual(updated.initial_sleep, '01:00');
            assert.strictEqual(updated.initial_wake, '09:00');
            assert.strictEqual(updated.shift_amount, 45);
            assert.strictEqual(updated.revision, 2);
        });

        it('should preserve user_id and id after update', () => {
            const userId = createTestUser('preserve-id');

            upsertSettingsForUser(userId, defaultSettings);
            const created = getSettingsForUser(userId);
            const createdId = created.id;

            upsertSettingsForUser(userId, {
                ...defaultSettings,
                revision: 2,
            });
            const updated = getSettingsForUser(userId);

            assert.strictEqual(updated.id, createdId, 'Settings id should remain the same');
            assert.strictEqual(updated.user_id, userId, 'user_id should remain the same');
        });

        it('should not create a second settings row for the same user', () => {
            const userId = createTestUser('no-dup-settings');
            upsertSettingsForUser(userId, defaultSettings);
            upsertSettingsForUser(userId, { ...defaultSettings, revision: 2 });

            const db = getDB();
            const count = db.prepare(
                'SELECT COUNT(*) as cnt FROM sleep_settings WHERE user_id = ?'
            ).get(userId);
            assert.strictEqual(count.cnt, 1, 'Should have exactly one settings row');
        });
    });

    // ---- setOverrideForUser ----

    describe('setOverrideForUser', () => {
        it('should create a new override', () => {
            const userId = createTestUser('override-create');
            setOverrideForUser(userId, '2025-06-01', 'hold');

            const overrides = getOverridesForUser(userId);
            assert.strictEqual(overrides.length, 1);
            assert.strictEqual(overrides[0].date_key, '2025-06-01');
            assert.strictEqual(overrides[0].action, 'hold');
            assert.strictEqual(overrides[0].user_id, userId);
        });

        it('should update an existing override for the same date', () => {
            const userId = createTestUser('override-update');
            setOverrideForUser(userId, '2025-06-01', 'hold');
            setOverrideForUser(userId, '2025-06-01', 'advance');

            const overrides = getOverridesForUser(userId);
            assert.strictEqual(overrides.length, 1, 'Should still have one override');
            assert.strictEqual(overrides[0].action, 'advance', 'Action should be updated');
        });

        it('should handle multiple dates independently', () => {
            const userId = createTestUser('override-multi');
            setOverrideForUser(userId, '2025-06-01', 'hold');
            setOverrideForUser(userId, '2025-06-02', 'advance');
            setOverrideForUser(userId, '2025-06-03', 'hold');

            const overrides = getOverridesForUser(userId);
            assert.strictEqual(overrides.length, 3);
        });

        it('should isolate overrides between users', () => {
            const userId1 = createTestUser('override-iso-1');
            const userId2 = createTestUser('override-iso-2');

            setOverrideForUser(userId1, '2025-06-01', 'hold');
            setOverrideForUser(userId2, '2025-06-01', 'advance');

            const overrides1 = getOverridesForUser(userId1);
            const overrides2 = getOverridesForUser(userId2);

            assert.strictEqual(overrides1.length, 1);
            assert.strictEqual(overrides1[0].action, 'hold');
            assert.strictEqual(overrides2.length, 1);
            assert.strictEqual(overrides2[0].action, 'advance');
        });
    });

    // ---- setAdvanceCheckForUser ----

    describe('setAdvanceCheckForUser', () => {
        it('should create a new advance check', () => {
            const userId = createTestUser('check-create');
            setAdvanceCheckForUser(userId, '2025-06-01', true);

            const checks = getAdvanceChecksForUser(userId);
            assert.strictEqual(checks.length, 1);
            assert.strictEqual(checks[0].date_key, '2025-06-01');
            assert.strictEqual(checks[0].checked, 1, 'true should be stored as 1');
        });

        it('should store false as 0', () => {
            const userId = createTestUser('check-false');
            setAdvanceCheckForUser(userId, '2025-06-01', false);

            const checks = getAdvanceChecksForUser(userId);
            assert.strictEqual(checks[0].checked, 0, 'false should be stored as 0');
        });

        it('should update an existing check for the same date', () => {
            const userId = createTestUser('check-update');
            setAdvanceCheckForUser(userId, '2025-06-01', true);
            setAdvanceCheckForUser(userId, '2025-06-01', false);

            const checks = getAdvanceChecksForUser(userId);
            assert.strictEqual(checks.length, 1, 'Should still have one check');
            assert.strictEqual(checks[0].checked, 0, 'Should be updated to false/0');
        });

        it('should handle multiple dates independently', () => {
            const userId = createTestUser('check-multi');
            setAdvanceCheckForUser(userId, '2025-06-01', true);
            setAdvanceCheckForUser(userId, '2025-06-02', false);
            setAdvanceCheckForUser(userId, '2025-06-03', true);

            const checks = getAdvanceChecksForUser(userId);
            assert.strictEqual(checks.length, 3);
        });

        it('should isolate checks between users', () => {
            const userId1 = createTestUser('check-iso-1');
            const userId2 = createTestUser('check-iso-2');

            setAdvanceCheckForUser(userId1, '2025-06-01', true);
            setAdvanceCheckForUser(userId2, '2025-06-01', false);

            const checks1 = getAdvanceChecksForUser(userId1);
            const checks2 = getAdvanceChecksForUser(userId2);

            assert.strictEqual(checks1[0].checked, 1);
            assert.strictEqual(checks2[0].checked, 0);
        });
    });
});
