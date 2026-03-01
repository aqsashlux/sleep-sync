CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    google_id       TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sleep_settings (
    id                    TEXT PRIMARY KEY,
    user_id               TEXT NOT NULL UNIQUE,
    schema_version        INTEGER NOT NULL DEFAULT 3,
    initial_sleep         TEXT NOT NULL DEFAULT '02:00',
    initial_wake          TEXT NOT NULL DEFAULT '10:00',
    goal_sleep            TEXT NOT NULL DEFAULT '23:00',
    goal_wake             TEXT NOT NULL DEFAULT '07:00',
    desired_sleep_hours   REAL NOT NULL DEFAULT 8.0,
    shift_amount          INTEGER NOT NULL DEFAULT 30,
    consolidation_days    INTEGER NOT NULL DEFAULT 2,
    start_date            TEXT NOT NULL,
    revision              INTEGER NOT NULL DEFAULT 0,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS day_overrides (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    date_key    TEXT NOT NULL,
    action      TEXT NOT NULL CHECK(action IN ('hold', 'advance')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS advance_checks (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    date_key    TEXT NOT NULL,
    checked     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sleep_settings_user ON sleep_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_day_overrides_user ON day_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_checks_user ON advance_checks(user_id);
