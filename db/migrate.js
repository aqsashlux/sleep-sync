import fs from 'fs';
import crypto from 'crypto';
import { initDatabase, getDB } from './database.js';
import { config } from '../config.js';

const migrate = () => {
    if (!fs.existsSync(config.LEGACY_DB_PATH)) {
        console.log('No db.json found. Nothing to migrate.');
        return;
    }

    initDatabase();
    const db = getDB();

    // Check idempotency
    const existing = db.prepare('SELECT id FROM users WHERE google_id = ?').get('legacy-user');
    if (existing) {
        console.log('Migration already completed. Legacy user exists.');
        return;
    }

    const raw = JSON.parse(fs.readFileSync(config.LEGACY_DB_PATH, 'utf8'));
    console.log('Read legacy db.json');

    const runMigration = db.transaction(() => {
        // Create legacy user
        const userId = crypto.randomUUID();
        db.prepare(`
            INSERT INTO users (id, google_id, email, display_name)
            VALUES (?, ?, ?, ?)
        `).run(userId, 'legacy-user', 'legacy@local', 'Usuario Local');

        // Migrate settings
        const settingsId = crypto.randomUUID();
        db.prepare(`
            INSERT INTO sleep_settings
            (id, user_id, schema_version, initial_sleep, initial_wake,
             goal_sleep, goal_wake, desired_sleep_hours, shift_amount,
             consolidation_days, start_date, revision)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            settingsId, userId, raw.schemaVersion || 3,
            raw.initialSleep || '02:00', raw.initialWake || '10:00',
            raw.goalSleep || raw.targetSleep || '23:00',
            raw.goalWake || raw.targetWake || '07:00',
            raw.desiredSleepHours || 8, raw.shiftAmount || 30,
            raw.consolidationDays || 2,
            raw.startDate || new Date().toISOString().split('T')[0],
            raw.revision || 0
        );

        // Migrate overrides
        const overrides = raw.overridesByDate || {};
        let overrideCount = 0;
        for (const [dateKey, action] of Object.entries(overrides)) {
            if (action === 'hold' || action === 'advance') {
                const id = crypto.randomUUID();
                db.prepare(
                    'INSERT INTO day_overrides (id, user_id, date_key, action) VALUES (?, ?, ?, ?)'
                ).run(id, userId, dateKey, action);
                overrideCount++;
            }
        }

        // Migrate advance checks
        const checks = raw.advanceChecksByDate || {};
        let checkCount = 0;
        for (const [dateKey, checked] of Object.entries(checks)) {
            const id = crypto.randomUUID();
            db.prepare(
                'INSERT INTO advance_checks (id, user_id, date_key, checked) VALUES (?, ?, ?, ?)'
            ).run(id, userId, dateKey, checked ? 1 : 0);
            checkCount++;
        }

        console.log(`Created user: ${userId}`);
        console.log(`Migrated: 1 settings, ${overrideCount} overrides, ${checkCount} advance checks`);
    });

    runMigration();
    console.log('Migration complete. You can now rename db.json to db.json.bak');
};

migrate();
