/**
 * Tests for services/user-service.js
 *
 * Validates CRUD operations for Google-authenticated users using an
 * in-memory SQLite database.
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDB, cleanTables, getDB } from './test-setup.js';
import {
    findOrCreateUserByGoogle,
    findUserById,
    findUserByGoogleId,
} from '../services/user-service.js';

describe('UserService', () => {
    before(() => {
        setupTestDB();
    });

    beforeEach(() => {
        cleanTables();
    });

    // ---- findOrCreateUserByGoogle: create new user ----

    describe('findOrCreateUserByGoogle — new user', () => {
        it('should create a new user and return it', () => {
            const result = findOrCreateUserByGoogle({
                googleId: 'google-123',
                email: 'alice@example.com',
                displayName: 'Alice',
                avatarUrl: 'https://example.com/alice.jpg',
            });

            assert.ok(result.id, 'Should have an id');
            assert.strictEqual(result.google_id, 'google-123');
            assert.strictEqual(result.email, 'alice@example.com');
            assert.strictEqual(result.display_name, 'Alice');
            assert.strictEqual(result.avatar_url, 'https://example.com/alice.jpg');
        });

        it('should generate a valid UUID for the new user id', () => {
            const result = findOrCreateUserByGoogle({
                googleId: 'google-456',
                email: 'bob@example.com',
                displayName: 'Bob',
                avatarUrl: null,
            });

            // UUID v4 format: 8-4-4-4-12 hex chars
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            assert.match(result.id, uuidRegex, 'id should be a valid UUID');
        });

        it('should persist the user in the database', () => {
            const created = findOrCreateUserByGoogle({
                googleId: 'google-789',
                email: 'charlie@example.com',
                displayName: 'Charlie',
                avatarUrl: null,
            });

            const found = findUserById(created.id);
            assert.ok(found, 'User should be found in DB after creation');
            assert.strictEqual(found.email, 'charlie@example.com');
        });

        it('should handle null avatarUrl', () => {
            const result = findOrCreateUserByGoogle({
                googleId: 'google-no-avatar',
                email: 'noavatar@example.com',
                displayName: 'No Avatar',
                avatarUrl: null,
            });

            assert.strictEqual(result.avatar_url, null);
        });
    });

    // ---- findOrCreateUserByGoogle: existing user ----

    describe('findOrCreateUserByGoogle — existing user', () => {
        it('should find existing user by googleId and update profile', () => {
            // First call creates the user
            const created = findOrCreateUserByGoogle({
                googleId: 'google-existing',
                email: 'old@example.com',
                displayName: 'Old Name',
                avatarUrl: 'https://example.com/old.jpg',
            });

            // Second call with same googleId should update
            const updated = findOrCreateUserByGoogle({
                googleId: 'google-existing',
                email: 'new@example.com',
                displayName: 'New Name',
                avatarUrl: 'https://example.com/new.jpg',
            });

            assert.strictEqual(updated.id, created.id, 'Should return same user id');
            assert.strictEqual(updated.email, 'new@example.com');
            assert.strictEqual(updated.display_name, 'New Name');
            assert.strictEqual(updated.avatar_url, 'https://example.com/new.jpg');
        });

        it('should persist updated fields in the database', () => {
            const created = findOrCreateUserByGoogle({
                googleId: 'google-persist-update',
                email: 'before@example.com',
                displayName: 'Before',
                avatarUrl: null,
            });

            findOrCreateUserByGoogle({
                googleId: 'google-persist-update',
                email: 'after@example.com',
                displayName: 'After',
                avatarUrl: 'https://example.com/after.jpg',
            });

            // Verify the DB was actually updated
            const fromDb = findUserById(created.id);
            assert.strictEqual(fromDb.email, 'after@example.com');
            assert.strictEqual(fromDb.display_name, 'After');
            assert.strictEqual(fromDb.avatar_url, 'https://example.com/after.jpg');
        });

        it('should not create a duplicate user when googleId exists', () => {
            findOrCreateUserByGoogle({
                googleId: 'google-no-dup',
                email: 'first@example.com',
                displayName: 'First',
                avatarUrl: null,
            });

            findOrCreateUserByGoogle({
                googleId: 'google-no-dup',
                email: 'second@example.com',
                displayName: 'Second',
                avatarUrl: null,
            });

            const db = getDB();
            const count = db.prepare(
                "SELECT COUNT(*) as cnt FROM users WHERE google_id = 'google-no-dup'"
            ).get();
            assert.strictEqual(count.cnt, 1, 'Should have only one user row');
        });
    });

    // ---- findUserById ----

    describe('findUserById', () => {
        it('should return the correct user', () => {
            const created = findOrCreateUserByGoogle({
                googleId: 'google-findbyid',
                email: 'findme@example.com',
                displayName: 'Find Me',
                avatarUrl: null,
            });

            const found = findUserById(created.id);
            assert.ok(found, 'Should find user by id');
            assert.strictEqual(found.id, created.id);
            assert.strictEqual(found.email, 'findme@example.com');
            assert.strictEqual(found.display_name, 'Find Me');
            assert.strictEqual(found.google_id, 'google-findbyid');
        });

        it('should return undefined for non-existent id', () => {
            const found = findUserById('non-existent-id-12345');
            assert.strictEqual(found, undefined, 'Should return undefined for missing user');
        });
    });

    // ---- findUserByGoogleId ----

    describe('findUserByGoogleId', () => {
        it('should return the correct user', () => {
            const created = findOrCreateUserByGoogle({
                googleId: 'google-findbygid',
                email: 'gid@example.com',
                displayName: 'GID User',
                avatarUrl: 'https://example.com/gid.jpg',
            });

            const found = findUserByGoogleId('google-findbygid');
            assert.ok(found, 'Should find user by googleId');
            assert.strictEqual(found.id, created.id);
            assert.strictEqual(found.email, 'gid@example.com');
        });

        it('should return undefined for non-existent googleId', () => {
            const found = findUserByGoogleId('google-nonexistent-99999');
            assert.strictEqual(found, undefined, 'Should return undefined for missing googleId');
        });
    });
});
