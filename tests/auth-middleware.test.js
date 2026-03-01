/**
 * Tests for middleware/auth.js
 *
 * Validates JWT authentication middleware (requireAuth and optionalAuth)
 * using real JWT tokens and mock Express req/res/next objects.
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { setupTestDB, cleanTables } from './test-setup.js';
import { findOrCreateUserByGoogle } from '../services/user-service.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

/** Create a mock Express response object that captures status/json calls */
const mockRes = () => {
    const res = {
        _status: null,
        _json: null,
        status(code) {
            res._status = code;
            return res;  // for chaining: res.status(401).json(...)
        },
        json(data) {
            res._json = data;
            return res;
        },
    };
    return res;
};

/** Create a mock next function that records whether it was called */
const mockNext = () => {
    const fn = () => { fn.called = true; };
    fn.called = false;
    return fn;
};

/** Helper: create a test user and return its id */
const createTestUser = () => {
    const user = findOrCreateUserByGoogle({
        googleId: 'google-auth-test',
        email: 'auth@example.com',
        displayName: 'Auth User',
        avatarUrl: 'https://example.com/auth.jpg',
    });
    return user.id;
};

/** Sign a JWT with the test secret */
const signToken = (payload, options = {}) => {
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: '1h',
        ...options,
    });
};

describe('Auth Middleware', () => {
    before(() => {
        setupTestDB();
    });

    beforeEach(() => {
        cleanTables();
    });

    // ---- requireAuth ----

    describe('requireAuth', () => {
        it('should reject request without Authorization header', () => {
            const req = { headers: {} };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.ok(res._json.error, 'Should return an error message');
            assert.strictEqual(next.called, false, 'next() should not be called');
        });

        it('should reject request with empty Authorization header', () => {
            const req = { headers: { authorization: '' } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.strictEqual(next.called, false);
        });

        it('should reject request with non-Bearer Authorization', () => {
            const req = { headers: { authorization: 'Basic abc123' } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.strictEqual(next.called, false);
        });

        it('should reject invalid/malformed token', () => {
            const req = { headers: { authorization: 'Bearer not-a-real-jwt-token' } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.ok(res._json.error, 'Should return error message');
            assert.strictEqual(next.called, false);
        });

        it('should reject token signed with wrong secret', () => {
            const token = jwt.sign(
                { userId: 'some-id', email: 'a@b.com' },
                'wrong-secret-key',
                { expiresIn: '1h' }
            );
            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.strictEqual(next.called, false);
        });

        it('should reject expired token with code TOKEN_EXPIRED', () => {
            const userId = createTestUser();
            // Create a token that is already expired
            const token = jwt.sign(
                { userId, email: 'auth@example.com' },
                config.JWT_SECRET,
                { expiresIn: '-1s' }  // expired 1 second ago
            );

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.strictEqual(res._json.code, 'TOKEN_EXPIRED', 'Should include TOKEN_EXPIRED code');
            assert.strictEqual(next.called, false);
        });

        it('should reject token for a non-existent user', () => {
            const token = signToken({
                userId: 'non-existent-user-id',
                email: 'ghost@example.com',
            });

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, 401);
            assert.ok(
                res._json.error.toLowerCase().includes('no encontrado') ||
                res._json.error.toLowerCase().includes('not found') ||
                res._json.error,
                'Should indicate user not found'
            );
            assert.strictEqual(next.called, false);
        });

        it('should attach req.user and call next() with valid token', () => {
            const userId = createTestUser();
            const token = signToken({ userId, email: 'auth@example.com' });

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should be called');
            assert.ok(req.user, 'req.user should be set');
            assert.strictEqual(req.user.id, userId);
            assert.strictEqual(req.user.email, 'auth@example.com');
            assert.strictEqual(req.user.displayName, 'Auth User');
            assert.strictEqual(req.user.avatarUrl, 'https://example.com/auth.jpg');
        });

        it('should not set status or json when token is valid', () => {
            const userId = createTestUser();
            const token = signToken({ userId, email: 'auth@example.com' });

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            requireAuth(req, res, next);

            assert.strictEqual(res._status, null, 'Should not call res.status()');
            assert.strictEqual(res._json, null, 'Should not call res.json()');
        });
    });

    // ---- optionalAuth ----

    describe('optionalAuth', () => {
        it('should allow request without Authorization header (req.user = null)', () => {
            const req = { headers: {} };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should be called');
            assert.strictEqual(req.user, null, 'req.user should be null');
        });

        it('should allow request with empty Authorization header (req.user = null)', () => {
            const req = { headers: { authorization: '' } };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should be called');
            assert.strictEqual(req.user, null);
        });

        it('should set req.user = null for invalid token (no error response)', () => {
            const req = { headers: { authorization: 'Bearer invalid-token' } };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should still be called');
            assert.strictEqual(req.user, null, 'req.user should be null for invalid token');
            assert.strictEqual(res._status, null, 'Should not set error status');
        });

        it('should set req.user = null for expired token (no error response)', () => {
            const userId = createTestUser();
            const token = jwt.sign(
                { userId, email: 'auth@example.com' },
                config.JWT_SECRET,
                { expiresIn: '-1s' }
            );

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should be called');
            assert.strictEqual(req.user, null, 'req.user should be null for expired token');
        });

        it('should populate req.user with valid token', () => {
            const userId = createTestUser();
            const token = signToken({ userId, email: 'auth@example.com' });

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should be called');
            assert.ok(req.user, 'req.user should be set');
            assert.strictEqual(req.user.id, userId);
            assert.strictEqual(req.user.email, 'auth@example.com');
        });

        it('should set req.user = null for token with non-existent user', () => {
            const token = signToken({
                userId: 'ghost-user-id',
                email: 'ghost@example.com',
            });

            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = mockRes();
            const next = mockNext();

            optionalAuth(req, res, next);

            assert.strictEqual(next.called, true, 'next() should still be called');
            assert.strictEqual(req.user, null, 'req.user should be null for missing user');
        });
    });
});
