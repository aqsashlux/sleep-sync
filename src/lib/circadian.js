// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CircadianPhase
 * @property {string}  id          - Unique phase identifier (e.g. 'inertia', 'morning-peak')
 * @property {string}  nameKey     - i18n key for the phase name
 * @property {string}  tipKey      - i18n key for the phase tip/description
 * @property {number}  offsetMin   - Minutes after wake when this phase starts
 * @property {number}  durationMin - Duration of the phase in minutes
 * @property {string}  emoji       - Emoji representing the phase
 * @property {number}  energy      - Energy level (0-100)
 */

/**
 * @typedef {Object} CalculatedPhase
 * @property {string}  startTime     - Phase start time (HH:MM)
 * @property {string}  endTime       - Phase end time (HH:MM)
 * @property {number}  startMinutes  - Phase start in minutes from midnight (mod 1440)
 * @property {number}  endMinutes    - Phase end in minutes from midnight (mod 1440)
 * @property {number}  index         - Position in the phases array
 */

/**
 * @typedef {Object} PhaseInfo
 * @property {CircadianPhase & Partial<CalculatedPhase>} current - The active phase
 * @property {number}  progress         - Percentage progress through the current phase (0-100)
 * @property {number}  remainingMinutes - Minutes remaining in the current phase
 * @property {(CalculatedPhase & CircadianPhase)|null} nextPhase - The upcoming phase, or null
 * @property {number}  minutesSinceWake - Minutes elapsed since wake time
 * @property {boolean} isWithinCycle    - Whether the time falls within the circadian cycle
 */

/**
 * @typedef {Object} SimulationResult
 * @property {string}  sleep                      - Computed sleep time (HH:MM)
 * @property {string}  wake                       - Computed wake time (HH:MM)
 * @property {'hold'|'advance'} action            - Action applied on the target date
 * @property {number}  dayIndex                   - Zero-based day offset from start date (-1 if before start)
 * @property {boolean} isBeforeStart              - Whether the target date is before the plan start
 * @property {boolean} advanceApplied             - Whether the advance was actually applied
 * @property {number}  appliedAdvanceSleepMinutes - Minutes the sleep time was advanced
 * @property {number}  appliedAdvanceWakeMinutes  - Minutes the wake time was advanced
 */

/**
 * @typedef {Object} AdvanceResult
 * @property {number} sleepStep      - Minutes to advance sleep (capped by remaining)
 * @property {number} wakeStep       - Minutes to advance wake (capped by remaining)
 * @property {number} sleepRemaining - Total minutes remaining to reach sleep goal
 * @property {number} wakeRemaining  - Total minutes remaining to reach wake goal
 */

/**
 * @typedef {Object} EnergyColor
 * @property {string} bg    - Tailwind background/gradient class
 * @property {string} text  - Tailwind text color class
 * @property {string} light - Tailwind light background + border class
 * @property {string} bar   - CSS class for the energy bar
 * @property {string} glow  - Tailwind glow shadow class (empty string if none)
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

/** @type {CircadianPhase[]} All circadian phases in chronological order from wake time. */
export const CIRCADIAN_PHASES = [
    { id: 'inertia', nameKey: 'phases.inertia', tipKey: 'phaseTips.inertia', offsetMin: 0, durationMin: 30, emoji: '\ud83d\ude34', energy: 20 },
    { id: 'waking', nameKey: 'phases.waking', tipKey: 'phaseTips.waking', offsetMin: 30, durationMin: 90, emoji: '\ud83c\udf05', energy: 45 },
    { id: 'morning-peak', nameKey: 'phases.morningPeak', tipKey: 'phaseTips.morningPeak', offsetMin: 120, durationMin: 120, emoji: '\u2600\ufe0f', energy: 95 },
    { id: 'plateau', nameKey: 'phases.plateau', tipKey: 'phaseTips.plateau', offsetMin: 240, durationMin: 120, emoji: '\ud83d\udcaa', energy: 85 },
    { id: 'post-lunch', nameKey: 'phases.postLunch', tipKey: 'phaseTips.postLunch', offsetMin: 360, durationMin: 120, emoji: '\ud83d\ude2a', energy: 35 },
    { id: 'recovery', nameKey: 'phases.recovery', tipKey: 'phaseTips.recovery', offsetMin: 480, durationMin: 120, emoji: '\u26a1', energy: 55 },
    { id: 'evening-peak', nameKey: 'phases.eveningPeak', tipKey: 'phaseTips.eveningPeak', offsetMin: 600, durationMin: 120, emoji: '\ud83c\udf1f', energy: 80 },
    { id: 'decline', nameKey: 'phases.decline', tipKey: 'phaseTips.decline', offsetMin: 720, durationMin: 120, emoji: '\ud83c\udf19', energy: 50 },
    { id: 'wind-down', nameKey: 'phases.windDown', tipKey: 'phaseTips.windDown', offsetMin: 840, durationMin: 120, emoji: '\ud83d\udca4', energy: 25 },
];

/** @type {Record<string, string>} Maps i18n language codes to Intl date locale strings. */
export const I18N_TO_DATE_LOCALE = { en: 'en-US', es: 'es-ES', pt: 'pt-BR', zh: 'zh-CN' };

// ─── Time helpers ─────────────────────────────────────────────────────────────

/**
 * Converts an "HH:MM" time string to total minutes since midnight.
 * @param {string} s - Time in HH:MM format
 * @returns {number} Minutes since 00:00
 */
export const timeToMinutes = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Converts minutes to an "HH:MM" string, wrapping around 24h (1440 min).
 * @param {number} m - Minutes (can be negative or > 1440)
 * @returns {string} Time in HH:MM format
 */
export const minutesToTime = (m) => {
    let nm = m % 1440;
    if (nm < 0) nm += 1440;
    return `${Math.floor(nm / 60).toString().padStart(2, '0')}:${(nm % 60).toString().padStart(2, '0')}`;
};

/**
 * Subtracts minutes from a time string, wrapping around midnight.
 * @param {string} t - Base time in HH:MM format
 * @param {number} m - Minutes to subtract
 * @returns {string} Resulting time in HH:MM format
 */
export const subtractTime = (t, m) => minutesToTime(timeToMinutes(t) - m);

/**
 * Clamps a number between min and max (inclusive).
 * @param {number} n   - Value to clamp
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number}
 */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Formats a Date as a "YYYY-MM-DD" string using local timezone.
 * @param {Date} [date=new Date()] - Date to format (defaults to today)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const toLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses a "YYYY-MM-DD" string into a local Date object.
 * @param {string} ymd - Date string in YYYY-MM-DD format
 * @returns {Date}
 */
export const parseLocalDate = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/**
 * Returns true if the given YYYY-MM-DD date is today or in the past.
 * @param {string} ymd - Date string in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isDateOnOrBeforeToday = (ymd) => ymd <= toLocalDateString();

/**
 * Adds (or subtracts) days from a date.
 * @param {string|Date} d    - Starting date (YYYY-MM-DD string or Date object)
 * @param {number}       days - Number of days to add (negative to subtract)
 * @returns {Date} New Date with the offset applied
 */
export const addDays = (d, days) => {
    const date = typeof d === 'string' ? parseLocalDate(d) : new Date(d);
    date.setDate(date.getDate() + days);
    return date;
};

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates that a value is a well-formed HH:MM time string (00:00 - 23:59).
 * @param {*} value - Value to validate
 * @returns {boolean}
 */
export const isValidTimeHHMM = (value) =>
    typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/**
 * Validates that a value is a well-formed YYYY-MM-DD date string
 * representing an actual calendar date (e.g. rejects 2025-02-29).
 * @param {*} value - Value to validate
 * @returns {boolean}
 */
export const isValidDateYYYYMMDD = (value) => {
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

// ─── Sanitization ─────────────────────────────────────────────────────────────

/**
 * Sanitizes a shift amount to a valid 5-minute step between 30 and 50.
 * Returns 30 for non-finite inputs.
 * @param {*} raw - Raw input value
 * @returns {number} Sanitized shift amount (30 | 35 | 40 | 45 | 50)
 */
export const sanitizeShiftAmount = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 30;
    const bounded = clamp(n, 30, 50);
    return Math.round((bounded - 30) / 5) * 5 + 30;
};

/**
 * Sanitizes desired sleep hours to a value between 4 and 12, rounded to 0.5.
 * Returns 8 for non-finite inputs.
 * @param {*} raw - Raw input value
 * @returns {number} Sanitized sleep hours (4.0 - 12.0, step 0.5)
 */
export const sanitizeDesiredSleepHoursValue = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 8;
    const bounded = Math.min(12, Math.max(4, n));
    return Math.round(bounded * 2) / 2;
};

/**
 * Sanitizes consolidation days to an integer between 1 and 7.
 * Returns 2 for non-finite inputs.
 * @param {*} raw - Raw input value
 * @returns {number} Sanitized consolidation days (1-7)
 */
export const sanitizeConsolidationDaysValue = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 2;
    return Math.min(7, Math.max(1, Math.round(n)));
};

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a day-override map, keeping only valid past/today dates
 * with 'hold' or 'advance' actions.
 * @param {*} raw - Raw override map (may be null/invalid)
 * @returns {Record<string, 'hold'|'advance'>} Normalized override map
 */
export const normalizeOverrideMap = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    for (const [dateKey, action] of Object.entries(raw)) {
        if (!isValidDateYYYYMMDD(dateKey)) continue;
        if (!isDateOnOrBeforeToday(dateKey)) continue;
        if (action === 'hold' || action === 'advance') normalized[dateKey] = action;
    }
    return normalized;
};

/**
 * Normalizes an advance-checks map, keeping only valid past/today dates
 * with boolean values.
 * @param {*} raw - Raw checks map (may be null/invalid)
 * @returns {Record<string, boolean>} Normalized checks map
 */
export const normalizeAdvanceChecksMap = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    for (const [dateKey, checked] of Object.entries(raw)) {
        if (!isValidDateYYYYMMDD(dateKey)) continue;
        if (!isDateOnOrBeforeToday(dateKey)) continue;
        if (typeof checked === 'boolean') normalized[dateKey] = checked;
    }
    return normalized;
};

// ─── Sleep duration ───────────────────────────────────────────────────────────

/**
 * Calculates sleep duration in hours between two time strings,
 * assuming midnight crossing (sleep before wake). Returns 8 if both are equal.
 * Result is rounded to the nearest 0.5 hours.
 * @param {string} sleepTime - Bedtime in HH:MM format
 * @param {string} wakeTime  - Wake time in HH:MM format
 * @returns {number} Duration in hours (rounded to 0.5)
 */
export const sleepDurationHoursBetweenTimes = (sleepTime, wakeTime) => {
    const [sh, sm] = String(sleepTime).split(':').map(Number);
    const [wh, wm] = String(wakeTime).split(':').map(Number);
    const sleepMins = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
    const wakeMins = (Number.isFinite(wh) ? wh : 0) * 60 + (Number.isFinite(wm) ? wm : 0);
    const durationMins = (wakeMins - sleepMins + 1440) % 1440;
    if (durationMins === 0) return 8;
    return Math.round((durationMins / 60) * 2) / 2;
};

// ─── Core algorithm ───────────────────────────────────────────────────────────

/**
 * Calculates how many minutes remain to reach a goal by advancing (subtracting).
 * @param {number} currentMinutes - Current time in minutes
 * @param {number} goalMinutes    - Goal time in minutes
 * @returns {number} Remaining minutes (0 if already at goal)
 */
const minutesUntilGoalByAdvancing = (currentMinutes, goalMinutes) =>
    (currentMinutes - goalMinutes + 1440) % 1440;

/**
 * Returns true if two HH:MM time strings represent the same time.
 * @param {string} a - First time (HH:MM)
 * @param {string} b - Second time (HH:MM)
 * @returns {boolean}
 */
export const sameTime = (a, b) => timeToMinutes(a) === timeToMinutes(b);

/**
 * Advances a time toward a goal by at most maxStepMinutes.
 * Returns the original time if already at the goal.
 * @param {string} currentTime    - Current time (HH:MM)
 * @param {string} goalTime       - Target time (HH:MM)
 * @param {number} maxStepMinutes - Maximum advance step in minutes
 * @returns {string} Advanced time (HH:MM)
 */
export const advanceTowardGoal = (currentTime, goalTime, maxStepMinutes) => {
    const currentMinutes = timeToMinutes(currentTime);
    const goalMinutes = timeToMinutes(goalTime);
    const remaining = minutesUntilGoalByAdvancing(currentMinutes, goalMinutes);
    if (remaining === 0) return currentTime;
    const step = Math.min(maxStepMinutes, remaining);
    return minutesToTime(currentMinutes - step);
};

/**
 * Calcula los minutos de avance que quedan hacia cada objetivo.
 *
 * @param {string} sleepTime   - Hora de sueño actual (HH:MM)
 * @param {string} wakeTime    - Hora de despertar actual (HH:MM)
 * @param {string} targetSleep - Hora objetivo de sueño (HH:MM)
 * @param {string} targetWake  - Hora objetivo de despertar (HH:MM)
 * @param {number} shiftAmount - Minutos de avance por sesión
 * @returns {AdvanceResult}
 */
export const computeAdvanceMinutesTowardGoals = (sleepTime, wakeTime, targetSleep, targetWake, shiftAmount) => {
    const sleepRemaining = minutesUntilGoalByAdvancing(
        timeToMinutes(sleepTime),
        timeToMinutes(targetSleep),
    );
    const wakeRemaining = minutesUntilGoalByAdvancing(
        timeToMinutes(wakeTime),
        timeToMinutes(targetWake),
    );
    return {
        sleepStep: Math.min(shiftAmount, sleepRemaining),
        wakeStep: Math.min(shiftAmount, wakeRemaining),
        sleepRemaining,
        wakeRemaining,
    };
};

/**
 * Simula el horario de sueño/despertar para una fecha dada,
 * tomando en cuenta todos los overrides y checks históricos.
 *
 * @param {string}  dateStr              - Fecha objetivo (YYYY-MM-DD)
 * @param {object}  overrideMap          - Mapa de overrides por fecha
 * @param {object}  checksMap            - Mapa de advance-checks por fecha
 * @param {string}  initialSleep         - Hora de inicio del plan (HH:MM)
 * @param {string}  initialWake          - Hora de despertar inicial (HH:MM)
 * @param {string}  targetSleep          - Meta de sueño (HH:MM)
 * @param {string}  targetWake           - Meta de despertar (HH:MM)
 * @param {number}  shiftAmount          - Minutos de avance por sesión
 * @param {number}  consolidationDays    - Días de consolidación por ciclo
 * @param {string}  startDate            - Fecha de inicio del plan (YYYY-MM-DD)
 * @returns {SimulationResult}
 */
export const simulateToDate = (
    dateStr,
    overrideMap,
    checksMap,
    initialSleep,
    initialWake,
    targetSleep,
    targetWake,
    shiftAmount,
    consolidationDays,
    startDate,
) => {
    const start = parseLocalDate(startDate);
    const date = parseLocalDate(dateStr);
    start.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const todayStr = toLocalDateString();

    const shouldApplyAdvanceForDate = (iterDateStr, action, chkMap) => {
        if (action !== 'advance') return false;
        if (iterDateStr > todayStr) return true;
        return chkMap[iterDateStr] !== false;
    };

    const isObjectiveReached = (wakeTime) => sameTime(wakeTime, targetWake);

    let sleep = initialSleep;
    let wake = initialWake;

    if (diffDays < 0) {
        return {
            sleep,
            wake,
            action: 'hold',
            dayIndex: -1,
            isBeforeStart: true,
            advanceApplied: false,
            appliedAdvanceSleepMinutes: 0,
            appliedAdvanceWakeMinutes: 0,
        };
    }

    let actionForDate = 'hold';
    let advanceAppliedForDate = false;
    let appliedAdvanceSleepMinutes = 0;
    let appliedAdvanceWakeMinutes = 0;
    let holdDaysRemaining = 0;
    let goalReachedBeforeDay = isObjectiveReached(wake);

    for (let i = 0; i <= diffDays; i++) {
        const iterDate = addDays(startDate, i);
        const iterDateStr = toLocalDateString(iterDate);
        const autoAction = goalReachedBeforeDay
            ? 'hold'
            : (consolidationDays <= 1
                ? 'advance'
                : (holdDaysRemaining === 0 ? 'advance' : 'hold'));
        const action = goalReachedBeforeDay ? 'hold' : (overrideMap[iterDateStr] || autoAction);
        const shouldApplyAdvance = shouldApplyAdvanceForDate(iterDateStr, action, checksMap);

        const { sleepRemaining, wakeRemaining } = computeAdvanceMinutesTowardGoals(
            sleep, wake, targetSleep, targetWake, shiftAmount,
        );
        const objectiveStep = Math.min(shiftAmount, wakeRemaining);
        const sleepStep = Math.min(objectiveStep, sleepRemaining);
        const wakeStep = objectiveStep;

        if (shouldApplyAdvance) {
            sleep = advanceTowardGoal(sleep, targetSleep, objectiveStep);
            wake = advanceTowardGoal(wake, targetWake, objectiveStep);
        }

        if (consolidationDays > 1) {
            if (action === 'advance') {
                holdDaysRemaining = consolidationDays - 1;
            } else if (holdDaysRemaining > 0) {
                holdDaysRemaining -= 1;
            }
        }
        goalReachedBeforeDay = isObjectiveReached(wake);

        if (i === diffDays) {
            actionForDate = action;
            advanceAppliedForDate = shouldApplyAdvance;
            appliedAdvanceSleepMinutes = shouldApplyAdvance ? sleepStep : 0;
            appliedAdvanceWakeMinutes = shouldApplyAdvance ? wakeStep : 0;
        }
    }

    return {
        sleep,
        wake,
        action: actionForDate,
        dayIndex: diffDays,
        isBeforeStart: false,
        advanceApplied: actionForDate === 'advance' ? advanceAppliedForDate : false,
        appliedAdvanceSleepMinutes,
        appliedAdvanceWakeMinutes,
    };
};

// ─── Circadian phases ─────────────────────────────────────────────────────────

/**
 * Calculates all circadian phase time windows based on a wake time.
 * @param {string} wakeTime - Wake time in HH:MM format
 * @returns {(CircadianPhase & CalculatedPhase)[]} Phases with computed start/end times
 */
export const calculateCircadianPhases = (wakeTime) => {
    const wakeMinutes = timeToMinutes(wakeTime);
    return CIRCADIAN_PHASES.map((phase, index) => {
        const startMinutes = wakeMinutes + phase.offsetMin;
        const endMinutes = startMinutes + phase.durationMin;
        return {
            ...phase,
            startTime: minutesToTime(startMinutes),
            endTime: minutesToTime(endMinutes),
            startMinutes: startMinutes % 1440,
            endMinutes: endMinutes % 1440,
            index,
        };
    });
};

/**
 * Determines which circadian phase is active at a given moment.
 * @param {(CircadianPhase & CalculatedPhase)[]} phases - Phases from calculateCircadianPhases
 * @param {Date}   now      - Current Date/time
 * @param {string} wakeTime - Wake time in HH:MM format
 * @returns {PhaseInfo}
 */
export const getCurrentPhase = (phases, now, wakeTime) => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const wakeMinutes = timeToMinutes(wakeTime);

    let minutesSinceWake = nowMinutes - wakeMinutes;
    if (minutesSinceWake < -720) minutesSinceWake += 1440;
    if (minutesSinceWake < 0) minutesSinceWake = 0;

    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseStart = phase.offsetMin;
        const phaseEnd = phaseStart + phase.durationMin;

        if (minutesSinceWake >= phaseStart && minutesSinceWake < phaseEnd) {
            const elapsed = minutesSinceWake - phaseStart;
            const remaining = phaseEnd - minutesSinceWake;
            const progress = (elapsed / phase.durationMin) * 100;
            const nextPhase = phases[i + 1] || null;

            return {
                current: phase,
                progress: Math.min(100, Math.max(0, progress)),
                remainingMinutes: remaining,
                nextPhase,
                minutesSinceWake,
                isWithinCycle: true,
            };
        }
    }

    const lastPhase = phases[phases.length - 1];
    const totalCycleMinutes = lastPhase.offsetMin + lastPhase.durationMin;

    if (minutesSinceWake >= totalCycleMinutes) {
        return {
            current: { ...lastPhase, nameKey: 'energy.outOfCycle', emoji: '\ud83c\udf1a', tipKey: 'energy.shouldBeSleeping', energy: 10 },
            progress: 100,
            remainingMinutes: 0,
            nextPhase: null,
            minutesSinceWake,
            isWithinCycle: false,
        };
    }

    return {
        current: { nameKey: 'energy.beforeWake', emoji: '\ud83d\udca4', tipKey: 'energy.notWokenYet', energy: 5 },
        progress: 0,
        remainingMinutes: 0,
        nextPhase: phases[0],
        minutesSinceWake: 0,
        isWithinCycle: false,
    };
};

// ─── Energy colors ────────────────────────────────────────────────────────────

/**
 * Returns Tailwind CSS classes for an energy level tier.
 * Tiers: >=80 (high), >=60 (medium), >=40 (low), >=25 (very-low), <25 (minimal).
 * @param {number} energy - Energy level (0-100)
 * @returns {EnergyColor}
 */
export const getEnergyColor = (energy) => {
    if (energy >= 80) return {
        bg: 'bg-gradient-to-r from-[#f4a261] to-[#f9c74f]',
        text: 'text-[#f4a261]',
        light: 'bg-[#f4a261]/10 border-[#f4a261]/20',
        bar: 'energy-bar-high',
        glow: 'shadow-[0_0_20px_rgba(244,162,97,0.4)]'
    };
    if (energy >= 60) return {
        bg: 'bg-gradient-to-r from-[#c77dff] to-[#9b5de5]',
        text: 'text-[#c77dff]',
        light: 'bg-[#9b5de5]/10 border-[#9b5de5]/20',
        bar: 'energy-bar-medium',
        glow: 'shadow-[0_0_20px_rgba(155,93,229,0.4)]'
    };
    if (energy >= 40) return {
        bg: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]',
        text: 'text-[#667eea]',
        light: 'bg-[#667eea]/10 border-[#667eea]/20',
        bar: 'energy-bar-low',
        glow: 'shadow-[0_0_20px_rgba(102,126,234,0.4)]'
    };
    if (energy >= 25) return {
        bg: 'bg-gradient-to-r from-[#4a5568] to-[#2d3748]',
        text: 'text-[#a09bb5]',
        light: 'bg-[#4a5568]/10 border-[#4a5568]/20',
        bar: 'energy-bar-very-low',
        glow: ''
    };
    return {
        bg: 'bg-[#2d3748]',
        text: 'text-[#6b6680]',
        light: 'bg-[#2d3748]/10 border-[#2d3748]/20',
        bar: 'bg-[#1a202c]',
        glow: ''
    };
};
