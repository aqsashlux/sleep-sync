import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findUserById, formatUser } from '../services/user-service.js';

export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticacion requerido' });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = findUserById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        req.user = formatUser(user);

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Token invalido' });
    }
};

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = findUserById(decoded.userId);
        req.user = user ? formatUser(user) : null;
    } catch {
        req.user = null;
    }

    next();
};
