import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { GUEST_DATA_KEY, OFFLINE_BACKUP_KEY } from '../lib/constants.js';
import { migratePayload } from '../lib/migrations.js';
import {
    sanitizeDesiredSleepHoursValue,
    sanitizeConsolidationDaysValue,
    normalizeOverrideMap,
    normalizeAdvanceChecksMap,
    toLocalDateString,
} from '../lib/circadian.js';

/** @typedef {'idle'|'saving'|'saved'|'warning'|'error'} SaveStatus */

/**
 * @typedef {Object} SleepScheduleData
 * @property {string} initialSleep       - Initial bedtime (HH:MM)
 * @property {string} initialWake        - Initial wake time (HH:MM)
 * @property {string} targetSleep        - Target bedtime (HH:MM)
 * @property {string} targetWake         - Target wake time (HH:MM)
 * @property {number} desiredSleepHours  - Desired sleep duration in hours
 * @property {number} shiftAmount        - Phase advance step in minutes
 * @property {number} consolidationDays  - Days per consolidation cycle
 * @property {string} startDate          - Plan start date (YYYY-MM-DD)
 * @property {Record<string, 'hold'|'advance'>} overridesByDate  - Day override map
 * @property {Record<string, boolean>} advanceChecksByDate       - Advance confirmation map
 */

/**
 * @typedef {Object} UseSleepDataReturn
 * @property {SleepScheduleData}  data              - All schedule data fields
 * @property {Function} setInitialSleep             - Setter for initialSleep
 * @property {Function} setInitialWake              - Setter for initialWake
 * @property {Function} setTargetSleep              - Setter for targetSleep
 * @property {Function} setTargetWake               - Setter for targetWake
 * @property {Function} setDesiredSleepHours        - Setter for desiredSleepHours
 * @property {Function} setShiftAmount              - Setter for shiftAmount
 * @property {Function} setConsolidationDays        - Setter for consolidationDays
 * @property {Function} setStartDate                - Setter for startDate
 * @property {Function} setOverridesByDate          - Setter for overridesByDate
 * @property {Function} setAdvanceChecksByDate      - Setter for advanceChecksByDate
 * @property {boolean}  isLoading                   - Data is being fetched
 * @property {string}   loadError                   - Error message from loading ('' if none)
 * @property {boolean}  isSaving                    - Data is being saved
 * @property {SaveStatus} saveStatus                - Current save state
 * @property {string}   saveStatusMessage           - Human-readable save status
 * @property {Date|null} lastSavedAt                - Timestamp of last successful save
 * @property {() => Promise<void>} save             - Manually trigger save
 * @property {() => void}          resetAll         - Reset all fields to defaults
 */

const DEFAULTS = {
    initialSleep: '02:00',
    initialWake: '10:00',
    goalSleep: '23:00',
    goalWake: '07:00',
    desiredSleepHours: 8,
    shiftAmount: 30,
    consolidationDays: 2,
    startDate: toLocalDateString(),
    overridesByDate: {},
    advanceChecksByDate: {},
    revision: 0,
};

/**
 * Manages all sleep schedule data: loading, autosaving, and resetting.
 * Supports both authenticated (API) and guest (localStorage) modes.
 * @param {{ isGuest: boolean, dateLocale: string }} options
 * @returns {UseSleepDataReturn}
 */
export function useSleepData({ isGuest, dateLocale }) {
    const { t } = useTranslation();

    const [initialSleep, setInitialSleep] = useState(DEFAULTS.initialSleep);
    const [initialWake, setInitialWake] = useState(DEFAULTS.initialWake);
    const [targetSleep, setTargetSleep] = useState(DEFAULTS.goalSleep);
    const [targetWake, setTargetWake] = useState(DEFAULTS.goalWake);
    const [desiredSleepHours, setDesiredSleepHours] = useState(DEFAULTS.desiredSleepHours);
    const [shiftAmount, setShiftAmount] = useState(DEFAULTS.shiftAmount);
    const [consolidationDays, setConsolidationDays] = useState(DEFAULTS.consolidationDays);
    const [startDate, setStartDate] = useState(DEFAULTS.startDate);
    const [overridesByDate, setOverridesByDate] = useState(DEFAULTS.overridesByDate);
    const [advanceChecksByDate, setAdvanceChecksByDate] = useState(DEFAULTS.advanceChecksByDate);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | warning | error
    const [saveStatusMessage, setSaveStatusMessage] = useState('');
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const revisionRef = useRef(0);
    const suppressAutosaveOnceRef = useRef(false);

    const applyLoadedData = useCallback((data) => {
        const migrated = migratePayload(data);
        setInitialSleep(migrated.initialSleep);
        setInitialWake(migrated.initialWake);
        setTargetSleep(migrated.goalSleep);
        setTargetWake(migrated.goalWake);
        setDesiredSleepHours(migrated.desiredSleepHours);
        setShiftAmount(migrated.shiftAmount);
        setConsolidationDays(migrated.consolidationDays);
        setStartDate(migrated.startDate);
        setOverridesByDate(migrated.overridesByDate);
        setAdvanceChecksByDate(migrated.advanceChecksByDate);
        revisionRef.current = migrated.revision;
    }, []);

    // Data Fetching
    useEffect(() => {
        let isCancelled = false;

        if (isGuest) {
            try {
                const stored = localStorage.getItem(GUEST_DATA_KEY);
                if (stored) applyLoadedData(JSON.parse(stored));
            } catch {
                // Datos de guest corruptos — se ignoran y se parte con defaults.
            }
            suppressAutosaveOnceRef.current = true;
            setIsLoading(false);
            return;
        }

        const load = async () => {
            try {
                const data = await api.get('/api/data');
                if (isCancelled) return;
                applyLoadedData(data || {});
                setLoadError('');
            } catch {
                // API no disponible — intentar fallback en localStorage (backup offline).
                try {
                    const stored = localStorage.getItem(OFFLINE_BACKUP_KEY);
                    if (!stored) throw new Error('no-local-fallback');
                    const fallbackData = JSON.parse(stored);
                    if (isCancelled) return;
                    applyLoadedData(fallbackData);
                    setLoadError(t('save.loadLocalFallback'));
                } catch {
                    // Sin backup disponible — la app inicia con valores por defecto.
                    if (!isCancelled) setLoadError(t('save.loadFailed'));
                }
            } finally {
                if (!isCancelled) {
                    suppressAutosaveOnceRef.current = true;
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            isCancelled = true;
        };
    }, [isGuest, applyLoadedData, t]);

    const wasPayloadPersisted = (payload, persisted) => {
        if (!persisted || typeof persisted !== 'object') return false;
        const persistedTargetSleep = persisted.goalSleep || persisted.targetSleep;
        const persistedTargetWake = persisted.goalWake || persisted.targetWake;
        const persistedRevision = Number.isFinite(Number(persisted.revision))
            ? Number(persisted.revision)
            : -1;
        return (
            persistedTargetSleep === payload.targetSleep &&
            persistedTargetWake === payload.targetWake &&
            Number(persisted.shiftAmount) === Number(payload.shiftAmount) &&
            String(persisted.startDate) === String(payload.startDate) &&
            persistedRevision >= Number(payload.revision)
        );
    };

    // Data Saving
    const save = useCallback(async () => {
        if (isGuest) {
            setIsSaving(true);
            setSaveStatus('saving');
            try {
                const payload = {
                    schemaVersion: 3, initialSleep, initialWake, targetSleep, targetWake,
                    goalSleep: targetSleep, goalWake: targetWake,
                    desiredSleepHours: sanitizeDesiredSleepHoursValue(desiredSleepHours),
                    shiftAmount, consolidationDays: sanitizeConsolidationDaysValue(consolidationDays),
                    startDate, overridesByDate, advanceChecksByDate, revision: 0,
                };
                localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(payload));
                const now = new Date();
                setLastSavedAt(now);
                setSaveStatus('saved');
                setSaveStatusMessage(t('save.savedVerified', { time: now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
            } catch {
                setSaveStatus('error');
                setSaveStatusMessage(t('save.localFallbackStatus'));
            } finally {
                setIsSaving(false);
            }
            return;
        }

        const nextRevision = revisionRef.current + 1;
        setIsSaving(true);
        setSaveStatus('saving');
        setSaveStatusMessage(t('save.saving'));

        const safeOverrides = normalizeOverrideMap(overridesByDate);
        const safeAdvanceChecks = normalizeAdvanceChecksMap(advanceChecksByDate);

        const payload = {
            schemaVersion: 3,
            initialSleep, initialWake, targetSleep, targetWake,
            goalSleep: targetSleep, goalWake: targetWake,
            desiredSleepHours: sanitizeDesiredSleepHoursValue(desiredSleepHours),
            shiftAmount,
            consolidationDays: sanitizeConsolidationDaysValue(consolidationDays),
            startDate,
            overridesByDate: safeOverrides,
            advanceChecksByDate: safeAdvanceChecks,
            revision: nextRevision,
        };

        try {
            const result = await api.post('/api/data', payload);

            if (!result?.success) throw new Error('api-save-rejected');

            if (result.applied === false) {
                const currentRevision = Number.isFinite(Number(result.currentRevision))
                    ? Number(result.currentRevision)
                    : nextRevision;
                revisionRef.current = currentRevision;
                setSaveStatus('warning');
                setSaveStatusMessage(t('save.conflictWarning'));
            } else {
                const persistedRevision = Number.isFinite(Number(result?.data?.revision))
                    ? Number(result.data.revision)
                    : nextRevision;
                revisionRef.current = persistedRevision;

                let isVerified = wasPayloadPersisted(payload, result?.data);
                if (!isVerified) {
                    try {
                        const verifyData = await api.get('/api/data');
                        isVerified = wasPayloadPersisted(payload, verifyData);
                    } catch {
                        // Error en verificación secundaria — se reportará como guardado parcial.
                    }
                }

                if (isVerified) {
                    const now = new Date();
                    setLastSavedAt(now);
                    setSaveStatus('saved');
                    setSaveStatusMessage(t('save.savedVerified', { time: now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
                } else {
                    setSaveStatus('warning');
                    setSaveStatusMessage(t('save.savedPartial'));
                }

                try {
                    localStorage.removeItem(OFFLINE_BACKUP_KEY);
                } catch {
                    // localStorage no disponible — se ignora.
                }
            }
        } catch {
            // Error de red o API — guardar backup offline para recuperación posterior.
            try {
                localStorage.setItem(OFFLINE_BACKUP_KEY, JSON.stringify(payload));
            } catch {
                // localStorage no disponible — backup imposible.
            }
            setSaveStatus('error');
            setSaveStatusMessage(t('save.localFallbackStatus'));
        } finally {
            setIsSaving(false);
        }
    }, [initialSleep, initialWake, targetSleep, targetWake, desiredSleepHours, shiftAmount, consolidationDays, startDate, overridesByDate, advanceChecksByDate, isGuest, t, dateLocale]);

    // Autosave effect
    useEffect(() => {
        if (isLoading) return;
        if (suppressAutosaveOnceRef.current) {
            suppressAutosaveOnceRef.current = false;
            return;
        }
        const timer = setTimeout(() => {
            void save();
        }, 1000);
        return () => clearTimeout(timer);
    }, [initialSleep, initialWake, targetSleep, targetWake, desiredSleepHours, shiftAmount, consolidationDays, startDate, overridesByDate, advanceChecksByDate, isLoading, save, isGuest]);

    const resetAll = useCallback(() => {
        suppressAutosaveOnceRef.current = false;
        setInitialSleep(DEFAULTS.initialSleep);
        setInitialWake(DEFAULTS.initialWake);
        setTargetSleep(DEFAULTS.goalSleep);
        setTargetWake(DEFAULTS.goalWake);
        setDesiredSleepHours(DEFAULTS.desiredSleepHours);
        setShiftAmount(DEFAULTS.shiftAmount);
        setConsolidationDays(DEFAULTS.consolidationDays);
        setStartDate(toLocalDateString());
        setOverridesByDate({});
        setAdvanceChecksByDate({});
    }, []);

    return {
        // Schedule data
        data: {
            initialSleep, initialWake,
            targetSleep, targetWake,
            desiredSleepHours, shiftAmount, consolidationDays,
            startDate, overridesByDate, advanceChecksByDate,
        },
        // Setters
        setInitialSleep, setInitialWake,
        setTargetSleep, setTargetWake,
        setDesiredSleepHours, setShiftAmount, setConsolidationDays,
        setStartDate, setOverridesByDate, setAdvanceChecksByDate,
        // Load state
        isLoading,
        loadError,
        // Save state
        isSaving,
        saveStatus,
        saveStatusMessage,
        lastSavedAt,
        // Actions
        save,
        resetAll,
    };
}
