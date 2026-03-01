import {
    sanitizeDesiredSleepHoursValue,
    sanitizeConsolidationDaysValue,
    sleepDurationHoursBetweenTimes,
    isValidDateYYYYMMDD,
    isDateOnOrBeforeToday,
    toLocalDateString,
} from './circadian.js';

/**
 * Normaliza un payload crudo de cualquier versión de schema al modelo v3.
 *
 * Versiones soportadas:
 *   v1 (legacy): { targetSleep, targetWake, lastSleep, lastWake, overrides }
 *   v2:          { schemaVersion >= 2, initialSleep, initialWake, goalSleep, goalWake }
 *   v3:          { schemaVersion >= 3, advanceChecksByDate }
 *
 * @param {object} raw - Datos crudos del storage o API
 * @returns {{
 *   initialSleep: string,
 *   initialWake: string,
 *   goalSleep: string,
 *   goalWake: string,
 *   desiredSleepHours: number,
 *   shiftAmount: number,
 *   consolidationDays: number,
 *   startDate: string,
 *   overridesByDate: object,
 *   advanceChecksByDate: object,
 *   revision: number,
 * }}
 */
export const migratePayload = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {};

    const legacySleep = data.targetSleep || data.lastSleep || '02:00';
    const legacyWake = data.targetWake || data.lastWake || '10:00';
    const hasExplicitGoal = Boolean(data.goalSleep || data.goalWake);
    const hasV2Model =
        Number(data.schemaVersion) >= 2 ||
        data.initialSleep ||
        data.initialWake ||
        hasExplicitGoal;

    let initialSleep, initialWake, goalSleep, goalWake, desiredSleepHours;

    if (hasV2Model) {
        initialSleep = data.initialSleep || data.currentSleep || legacySleep;
        initialWake = data.initialWake || data.currentWake || legacyWake;
        goalSleep = data.goalSleep || data.targetSleep || '23:00';
        goalWake = data.goalWake || data.targetWake || '07:00';
        const hasDesiredSleepHours = Number.isFinite(Number(data.desiredSleepHours));
        desiredSleepHours = hasDesiredSleepHours
            ? sanitizeDesiredSleepHoursValue(data.desiredSleepHours)
            : sleepDurationHoursBetweenTimes(initialSleep, initialWake);
    } else {
        // Migración v1 legacy: conservar horas históricas sin forzar una meta por defecto.
        initialSleep = legacySleep;
        initialWake = legacyWake;
        goalSleep = legacySleep;
        goalWake = legacyWake;
        desiredSleepHours = sleepDurationHoursBetweenTimes(legacySleep, legacyWake);
    }

    // Normalizar overrides (soporta clave legacy 'overrides')
    const rawOverrides = data.overridesByDate || data.overrides || {};
    const overridesByDate = {};
    if (rawOverrides && typeof rawOverrides === 'object') {
        for (const [dateKey, action] of Object.entries(rawOverrides)) {
            if (!isValidDateYYYYMMDD(dateKey)) continue;
            if (!isDateOnOrBeforeToday(dateKey)) continue;
            if (action === 'hold' || action === 'advance') overridesByDate[dateKey] = action;
        }
    }

    // Normalizar advanceChecks (soporta clave legacy 'advanceCompletionByDate')
    const rawAdvanceChecks = data.advanceChecksByDate || data.advanceCompletionByDate || {};
    const advanceChecksByDate = {};
    if (rawAdvanceChecks && typeof rawAdvanceChecks === 'object') {
        for (const [dateKey, checked] of Object.entries(rawAdvanceChecks)) {
            if (!isValidDateYYYYMMDD(dateKey)) continue;
            if (!isDateOnOrBeforeToday(dateKey)) continue;
            if (typeof checked === 'boolean') advanceChecksByDate[dateKey] = checked;
        }
    }

    return {
        initialSleep,
        initialWake,
        goalSleep,
        goalWake,
        desiredSleepHours,
        shiftAmount: data.shiftAmount || 30,
        consolidationDays: sanitizeConsolidationDaysValue(data.consolidationDays),
        startDate: data.startDate || toLocalDateString(),
        overridesByDate,
        advanceChecksByDate,
        revision: Number.isFinite(Number(data.revision)) ? Number(data.revision) : 0,
    };
};
