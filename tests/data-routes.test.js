/**
 * Tests for routes/data.js
 *
 * Integration tests that exercise the /api/data endpoints through a real
 * Express app (using Node's built-in http module for requests) with an
 * in-memory SQLite database.
 *
 * Each test gets a fresh database and a valid JWT for a test user.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { setupTestDB, cleanTables } from './test-setup.js';
import { findOrCreateUserByGoogle } from '../services/user-service.js';
import dataRoutes from '../routes/data.js';

// ---- Test Express app ----

let server;
let baseUrl;

const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/data', dataRoutes);
    return app;
};

/** Simple HTTP request helper using Node built-in http module */
const request = (method, path, { body, token } = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                    });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

/** Helper: create a user and return { userId, token } */
const createAuthenticatedUser = (suffix = '1') => {
    const user = findOrCreateUserByGoogle({
        googleId: `google-data-test-${suffix}`,
        email: `datatest-${suffix}@example.com`,
        displayName: `Data User ${suffix}`,
        avatarUrl: null,
    });

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { userId: user.id, token };
};

describe('Data Routes (/api/data)', () => {
    before(async () => {
        setupTestDB();
        const app = createApp();
        server = await new Promise((resolve) => {
            const s = app.listen(0, '127.0.0.1', () => {
                resolve(s);
            });
        });
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
    });

    beforeEach(() => {
        cleanTables();
    });

    after(() => {
        if (server) server.close();
    });

    // ---- Authentication enforcement ----

    describe('Authentication', () => {
        it('GET /api/data should reject unauthenticated request', async () => {
            const res = await request('GET', '/api/data');
            assert.strictEqual(res.status, 401);
        });

        it('POST /api/data should reject unauthenticated request', async () => {
            const res = await request('POST', '/api/data', { body: {} });
            assert.strictEqual(res.status, 401);
        });
    });

    // ---- GET /api/data ----

    describe('GET /api/data', () => {
        it('should return defaults for a user without saved settings', async () => {
            const { token } = createAuthenticatedUser('get-defaults');

            const res = await request('GET', '/api/data', { token });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.schemaVersion, 3);
            assert.strictEqual(res.body.initialSleep, '02:00');
            assert.strictEqual(res.body.initialWake, '10:00');
            assert.strictEqual(res.body.goalSleep, '23:00');
            assert.strictEqual(res.body.goalWake, '07:00');
            assert.strictEqual(res.body.desiredSleepHours, 8);
            assert.strictEqual(res.body.shiftAmount, 30);
            assert.strictEqual(res.body.consolidationDays, 2);
            assert.strictEqual(res.body.revision, 0);
            // Should include retrocompatibility aliases
            assert.strictEqual(res.body.targetSleep, '23:00');
            assert.strictEqual(res.body.targetWake, '07:00');
            // Empty maps
            assert.deepStrictEqual(res.body.overridesByDate, {});
            assert.deepStrictEqual(res.body.advanceChecksByDate, {});
            // startDate should be today's date (YYYY-MM-DD format)
            assert.match(res.body.startDate, /^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return saved data after POST', async () => {
            const { token } = createAuthenticatedUser('get-after-post');

            // Save data first
            await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '04:00',
                    initialWake: '12:00',
                    goalSleep: '22:30',
                    goalWake: '06:30',
                    desiredSleepHours: 7.5,
                    shiftAmount: 45,
                    consolidationDays: 3,
                    startDate: '2025-07-01',
                    revision: 1,
                    overridesByDate: {
                        '2025-07-02': 'hold',
                        '2025-07-03': 'advance',
                    },
                    advanceChecksByDate: {
                        '2025-07-01': true,
                        '2025-07-02': false,
                    },
                },
            });

            // Now GET should return the saved data
            const res = await request('GET', '/api/data', { token });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.initialSleep, '04:00');
            assert.strictEqual(res.body.initialWake, '12:00');
            assert.strictEqual(res.body.goalSleep, '22:30');
            assert.strictEqual(res.body.goalWake, '06:30');
            assert.strictEqual(res.body.desiredSleepHours, 7.5);
            assert.strictEqual(res.body.shiftAmount, 45);
            assert.strictEqual(res.body.consolidationDays, 3);
            assert.strictEqual(res.body.startDate, '2025-07-01');
            assert.strictEqual(res.body.revision, 1);
            // Retrocompatibility aliases
            assert.strictEqual(res.body.targetSleep, '22:30');
            assert.strictEqual(res.body.targetWake, '06:30');
            // Overrides
            assert.strictEqual(res.body.overridesByDate['2025-07-02'], 'hold');
            assert.strictEqual(res.body.overridesByDate['2025-07-03'], 'advance');
            // Advance checks
            assert.strictEqual(res.body.advanceChecksByDate['2025-07-01'], true);
            assert.strictEqual(res.body.advanceChecksByDate['2025-07-02'], false);
        });
    });

    // ---- POST /api/data ----

    describe('POST /api/data', () => {
        it('should save data successfully and return applied: true', async () => {
            const { token } = createAuthenticatedUser('post-basic');

            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    consolidationDays: 2,
                    startDate: '2025-06-01',
                    revision: 1,
                },
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.applied, true);
            assert.ok(res.body.data, 'Should include data in response');
            assert.strictEqual(res.body.data.initialSleep, '03:00');
        });

        it('should sanitize shiftAmount to valid range (30-50, step 5)', async () => {
            const { token } = createAuthenticatedUser('post-sanitize-shift');

            // shiftAmount of 10 should be clamped to 30
            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 10,
                    startDate: '2025-06-01',
                    revision: 1,
                },
            });

            assert.strictEqual(res.body.data.shiftAmount, 30);
        });

        it('should reject revision conflict (incoming revision <= current)', async () => {
            const { token } = createAuthenticatedUser('post-conflict');

            // First save with revision 5
            await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 5,
                },
            });

            // Try to save with revision 3 (lower than current 5)
            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '01:00',
                    initialWake: '09:00',
                    goalSleep: '22:00',
                    goalWake: '06:00',
                    shiftAmount: 45,
                    startDate: '2025-06-01',
                    revision: 3,
                },
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.applied, false, 'Should not apply stale revision');
            assert.strictEqual(res.body.currentRevision, 5);
        });

        it('should reject revision equal to current (not just lower)', async () => {
            const { token } = createAuthenticatedUser('post-equal-rev');

            // Save with revision 2
            await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 2,
                },
            });

            // Try to save with same revision 2
            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '01:00',
                    initialWake: '09:00',
                    goalSleep: '22:00',
                    goalWake: '06:00',
                    startDate: '2025-06-01',
                    revision: 2,
                },
            });

            assert.strictEqual(res.body.applied, false, 'Equal revision should not apply');
        });

        it('should accept higher revision and apply changes', async () => {
            const { token } = createAuthenticatedUser('post-higher-rev');

            // Save with revision 1
            await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 1,
                },
            });

            // Save with revision 2 (higher)
            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '01:00',
                    initialWake: '09:00',
                    goalSleep: '22:00',
                    goalWake: '06:00',
                    shiftAmount: 45,
                    startDate: '2025-06-01',
                    revision: 2,
                },
            });

            assert.strictEqual(res.body.applied, true, 'Higher revision should be applied');
            assert.strictEqual(res.body.data.initialSleep, '01:00');
            assert.strictEqual(res.body.data.shiftAmount, 45);
        });

        it('should persist overrides and advance checks', async () => {
            const { token } = createAuthenticatedUser('post-persist-maps');

            await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 1,
                    overridesByDate: {
                        '2025-06-01': 'hold',
                        '2025-06-02': 'advance',
                    },
                    advanceChecksByDate: {
                        '2025-06-01': true,
                    },
                },
            });

            // Verify via GET
            const res = await request('GET', '/api/data', { token });
            assert.strictEqual(res.body.overridesByDate['2025-06-01'], 'hold');
            assert.strictEqual(res.body.overridesByDate['2025-06-02'], 'advance');
            assert.strictEqual(res.body.advanceChecksByDate['2025-06-01'], true);
        });

        it('should isolate data between users', async () => {
            const user1 = createAuthenticatedUser('iso-1');
            const user2 = createAuthenticatedUser('iso-2');

            // User 1 saves data
            await request('POST', '/api/data', {
                token: user1.token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 1,
                },
            });

            // User 2 should still get defaults
            const res = await request('GET', '/api/data', { token: user2.token });
            assert.strictEqual(res.body.revision, 0, 'User 2 should have default revision 0');
            assert.strictEqual(res.body.initialSleep, '02:00', 'User 2 should have default initialSleep');
        });

        it('should sanitize invalid overrides (bad date keys, bad actions)', async () => {
            const { token } = createAuthenticatedUser('post-sanitize-overrides');

            const res = await request('POST', '/api/data', {
                token,
                body: {
                    initialSleep: '03:00',
                    initialWake: '11:00',
                    goalSleep: '23:00',
                    goalWake: '07:00',
                    shiftAmount: 30,
                    startDate: '2025-06-01',
                    revision: 1,
                    overridesByDate: {
                        'not-a-date': 'hold',           // Invalid date key
                        '2025-06-01': 'invalid-action',  // Invalid action
                        '2025-06-02': 'advance',         // Valid
                    },
                },
            });

            assert.strictEqual(res.body.applied, true);
            // Only the valid override should be in the response
            assert.strictEqual(res.body.data.overridesByDate['not-a-date'], undefined);
            assert.strictEqual(res.body.data.overridesByDate['2025-06-01'], undefined);
            assert.strictEqual(res.body.data.overridesByDate['2025-06-02'], 'advance');
        });
    });
});
