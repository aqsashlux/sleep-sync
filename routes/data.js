import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    getSettingsForUser,
    upsertSettingsForUser,
    getOverridesForUser,
    setOverrideForUser,
    getAdvanceChecksForUser,
    setAdvanceCheckForUser,
} from '../services/sleep-service.js';

const router = Router();

/* ------------------------------------------------------------------ */
/*  Sanitization helpers (ported from server.js)                      */
/* ------------------------------------------------------------------ */

const toLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isValidTimeHHMM = (value) =>
    typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidDateYYYYMMDD = (value) => {
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const sanitizeShiftAmount = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 30;
    const bounded = clamp(n, 30, 50);
    return Math.round((bounded - 30) / 5) * 5 + 30;
};

const sanitizeDesiredSleepHours = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 8;
    const bounded = clamp(n, 4, 12);
    return Math.round(bounded * 2) / 2;
};

const sanitizeConsolidationDays = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 2;
    return clamp(Math.round(n), 1, 7);
};

const sleepDurationHoursBetweenTimes = (sleepTime, wakeTime) => {
    const [sh, sm] = String(sleepTime).split(':').map(Number);
    const [wh, wm] = String(wakeTime).split(':').map(Number);
    const sleepMins = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
    const wakeMins = (Number.isFinite(wh) ? wh : 0) * 60 + (Number.isFinite(wm) ? wm : 0);
    const durationMins = (wakeMins - sleepMins + 1440) % 1440;
    if (durationMins === 0) return 8;
    return Math.round((durationMins / 60) * 2) / 2;
};

const pickFirstValidTime = (...values) => {
    for (const value of values) {
        if (isValidTimeHHMM(value)) return value;
    }
    return null;
};

const DEFAULTS = {
    schemaVersion: 3,
    initialSleep: '02:00',
    initialWake: '10:00',
    goalSleep: '23:00',
    goalWake: '07:00',
    desiredSleepHours: 8,
    shiftAmount: 30,
    consolidationDays: 2,
};

/**
 * Sanitizes a raw data object (from request body or DB row) into a
 * clean, validated settings object. Mirrors the sanitizePersistedData
 * logic from server.js so every value written to (or read from) the
 * database goes through the same validation pipeline.
 */
const sanitizePayload = (source, fallbackRevision = 0) => {
    const initialSleep = pickFirstValidTime(
        source.initialSleep, source.currentSleep,
        source.targetSleep, source.lastSleep,
    ) || DEFAULTS.initialSleep;

    const initialWake = pickFirstValidTime(
        source.initialWake, source.currentWake,
        source.targetWake, source.lastWake,
    ) || DEFAULTS.initialWake;

    const goalSleep = pickFirstValidTime(
        source.goalSleep, source.targetSleep,
    ) || DEFAULTS.goalSleep;

    const goalWake = pickFirstValidTime(
        source.goalWake, source.targetWake,
    ) || DEFAULTS.goalWake;

    const desiredSleepHours = Number.isFinite(Number(source.desiredSleepHours))
        ? sanitizeDesiredSleepHours(source.desiredSleepHours)
        : sleepDurationHoursBetweenTimes(initialSleep, initialWake);

    const shiftAmount = sanitizeShiftAmount(source.shiftAmount);
    const consolidationDays = sanitizeConsolidationDays(source.consolidationDays);
    const startDate = isValidDateYYYYMMDD(source.startDate)
        ? source.startDate
        : toLocalDateString();

    const revision = Number.isFinite(Number(source.revision))
        ? Math.max(0, Math.floor(Number(source.revision)))
        : Math.max(0, Math.floor(Number(fallbackRevision) || 0));

    return {
        schemaVersion: 3,
        initialSleep,
        initialWake,
        goalSleep,
        goalWake,
        desiredSleepHours,
        shiftAmount,
        consolidationDays,
        startDate,
        revision,
    };
};

/**
 * Sanitize an overrides map. Only keeps entries with valid YYYY-MM-DD
 * keys and 'hold' | 'advance' values.
 */
const sanitizeOverridesMap = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    for (const [dateKey, action] of Object.entries(raw)) {
        if (!isValidDateYYYYMMDD(dateKey)) continue;
        if (action === 'hold' || action === 'advance') normalized[dateKey] = action;
    }
    return normalized;
};

/**
 * Sanitize an advance-checks map. Only keeps entries with valid
 * YYYY-MM-DD keys and boolean values.
 */
const sanitizeAdvanceChecksMap = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    for (const [dateKey, checked] of Object.entries(raw)) {
        if (!isValidDateYYYYMMDD(dateKey)) continue;
        if (typeof checked === 'boolean') normalized[dateKey] = checked;
    }
    return normalized;
};

/* ------------------------------------------------------------------ */
/*  Helpers to convert between DB row shape and API response shape     */
/* ------------------------------------------------------------------ */

/**
 * Builds the API response object from a DB settings row plus the
 * already-sanitized overrides and advance-checks maps.
 * Includes targetSleep/targetWake aliases for frontend retrocompatibility.
 */
const buildResponseFromRow = (settings, overridesByDate, advanceChecksByDate) => ({
    schemaVersion: settings.schema_version,
    initialSleep: settings.initial_sleep,
    initialWake: settings.initial_wake,
    goalSleep: settings.goal_sleep,
    goalWake: settings.goal_wake,
    targetSleep: settings.goal_sleep,
    targetWake: settings.goal_wake,
    desiredSleepHours: settings.desired_sleep_hours,
    shiftAmount: settings.shift_amount,
    consolidationDays: settings.consolidation_days,
    startDate: settings.start_date,
    overridesByDate,
    advanceChecksByDate,
    revision: settings.revision,
});

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * GET /api/data
 * Devuelve los datos de sueno del usuario autenticado.
 * Aplica sanitizacion sobre los valores almacenados para garantizar
 * que la respuesta siempre cumpla las mismas reglas de validacion
 * que server.js (sanitizePersistedData).
 */
router.get('/', requireAuth, (req, res) => {
    const userId = req.user.id;

    const settings = getSettingsForUser(userId);
    const overrides = getOverridesForUser(userId);
    const advanceChecks = getAdvanceChecksForUser(userId);

    if (!settings) {
        const defaultSettings = {
            schema_version: 3,
            initial_sleep: DEFAULTS.initialSleep,
            initial_wake: DEFAULTS.initialWake,
            goal_sleep: DEFAULTS.goalSleep,
            goal_wake: DEFAULTS.goalWake,
            desired_sleep_hours: DEFAULTS.desiredSleepHours,
            shift_amount: DEFAULTS.shiftAmount,
            consolidation_days: DEFAULTS.consolidationDays,
            start_date: toLocalDateString(),
            revision: 0,
        };
        return res.json(buildResponseFromRow(defaultSettings, {}, {}));
    }

    const overridesByDate = {};
    for (const o of overrides) {
        if (isValidDateYYYYMMDD(o.date_key) && (o.action === 'hold' || o.action === 'advance')) {
            overridesByDate[o.date_key] = o.action;
        }
    }

    const advanceChecksByDate = {};
    for (const c of advanceChecks) {
        if (isValidDateYYYYMMDD(c.date_key)) {
            advanceChecksByDate[c.date_key] = c.checked === 1;
        }
    }

    res.json(buildResponseFromRow(settings, overridesByDate, advanceChecksByDate));
});

/**
 * POST /api/data
 * Guarda los datos de sueno del usuario autenticado.
 * Mantiene logica de revision para prevenir conflictos.
 * Todos los valores pasan por la misma sanitizacion que server.js.
 */
router.post('/', requireAuth, (req, res) => {
    const userId = req.user.id;
    const body = req.body || {};

    const currentSettings = getSettingsForUser(userId);
    const currentRevision = currentSettings ? currentSettings.revision : 0;

    const incomingRevision = Number.isFinite(Number(body.revision))
        ? Math.max(0, Math.floor(Number(body.revision)))
        : currentRevision + 1;

    if (incomingRevision <= currentRevision) {
        return res.json({ success: true, applied: false, currentRevision });
    }

    // Sanitize all incoming values through the same pipeline as server.js
    const sanitized = sanitizePayload({
        ...body,
        revision: incomingRevision,
    }, incomingRevision);

    upsertSettingsForUser(userId, sanitized);

    // Sanitize and persist overrides
    const cleanOverrides = sanitizeOverridesMap(body.overridesByDate);
    for (const [dateKey, action] of Object.entries(cleanOverrides)) {
        setOverrideForUser(userId, dateKey, action);
    }

    // Sanitize and persist advance checks
    const cleanAdvanceChecks = sanitizeAdvanceChecksMap(body.advanceChecksByDate);
    for (const [dateKey, checked] of Object.entries(cleanAdvanceChecks)) {
        setAdvanceCheckForUser(userId, dateKey, checked);
    }

    return res.json({
        success: true,
        applied: true,
        data: {
            ...sanitized,
            targetSleep: sanitized.goalSleep,
            targetWake: sanitized.goalWake,
            overridesByDate: cleanOverrides,
            advanceChecksByDate: cleanAdvanceChecks,
        },
    });
});

export default router;
