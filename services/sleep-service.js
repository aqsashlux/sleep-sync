import crypto from 'crypto';
import { getDB } from '../db/database.js';

export const getSettingsForUser = (userId) => {
    const db = getDB();
    return db.prepare('SELECT * FROM sleep_settings WHERE user_id = ?').get(userId);
};

export const upsertSettingsForUser = (userId, data) => {
    const db = getDB();
    const existing = getSettingsForUser(userId);

    if (existing) {
        db.prepare(`
            UPDATE sleep_settings
            SET schema_version = ?, initial_sleep = ?, initial_wake = ?,
                goal_sleep = ?, goal_wake = ?, desired_sleep_hours = ?,
                shift_amount = ?, consolidation_days = ?, start_date = ?,
                revision = ?, updated_at = datetime('now')
            WHERE user_id = ?
        `).run(
            data.schemaVersion, data.initialSleep, data.initialWake,
            data.goalSleep, data.goalWake, data.desiredSleepHours,
            data.shiftAmount, data.consolidationDays, data.startDate,
            data.revision, userId
        );
    } else {
        const id = crypto.randomUUID();
        db.prepare(`
            INSERT INTO sleep_settings
            (id, user_id, schema_version, initial_sleep, initial_wake,
             goal_sleep, goal_wake, desired_sleep_hours, shift_amount,
             consolidation_days, start_date, revision)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, userId, data.schemaVersion, data.initialSleep, data.initialWake,
            data.goalSleep, data.goalWake, data.desiredSleepHours, data.shiftAmount,
            data.consolidationDays, data.startDate, data.revision
        );
    }
};

export const getOverridesForUser = (userId) => {
    const db = getDB();
    return db.prepare('SELECT * FROM day_overrides WHERE user_id = ?').all(userId);
};

export const setOverrideForUser = (userId, dateKey, action) => {
    const db = getDB();
    const existing = db.prepare(
        'SELECT id FROM day_overrides WHERE user_id = ? AND date_key = ?'
    ).get(userId, dateKey);

    if (existing) {
        db.prepare('UPDATE day_overrides SET action = ? WHERE id = ?').run(action, existing.id);
    } else {
        const id = crypto.randomUUID();
        db.prepare(
            'INSERT INTO day_overrides (id, user_id, date_key, action) VALUES (?, ?, ?, ?)'
        ).run(id, userId, dateKey, action);
    }
};

export const getAdvanceChecksForUser = (userId) => {
    const db = getDB();
    return db.prepare('SELECT * FROM advance_checks WHERE user_id = ?').all(userId);
};

export const setAdvanceCheckForUser = (userId, dateKey, checked) => {
    const db = getDB();
    const existing = db.prepare(
        'SELECT id FROM advance_checks WHERE user_id = ? AND date_key = ?'
    ).get(userId, dateKey);

    const checkedInt = checked ? 1 : 0;
    if (existing) {
        db.prepare('UPDATE advance_checks SET checked = ? WHERE id = ?').run(checkedInt, existing.id);
    } else {
        const id = crypto.randomUUID();
        db.prepare(
            'INSERT INTO advance_checks (id, user_id, date_key, checked) VALUES (?, ?, ?, ?)'
        ).run(id, userId, dateKey, checkedInt);
    }
};
