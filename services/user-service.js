import crypto from 'crypto';
import { getDB } from '../db/database.js';

export const findUserById = (id) => {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

export const findUserByGoogleId = (googleId) => {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
};

export const formatUser = (u) => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
});

export const findOrCreateUserByGoogle = ({ googleId, email, displayName, avatarUrl }) => {
    const db = getDB();

    const existing = findUserByGoogleId(googleId);
    if (existing) {
        db.prepare(`
            UPDATE users
            SET email = ?, display_name = ?, avatar_url = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(email, displayName, avatarUrl, existing.id);

        return { ...existing, email, display_name: displayName, avatar_url: avatarUrl };
    }

    const id = crypto.randomUUID();
    db.prepare(`
        INSERT INTO users (id, google_id, email, display_name, avatar_url)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, googleId, email, displayName, avatarUrl);

    return { id, google_id: googleId, email, display_name: displayName, avatar_url: avatarUrl };
};
