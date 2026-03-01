import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findOrCreateUserByGoogle, formatUser } from '../services/user-service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Recibe el credential (ID token) de Google Identity Services.
 * Verifica el token con la clave publica de Google, crea o encuentra al usuario
 * en la base de datos, y devuelve un JWT de sesion firmado.
 *
 * Controles de seguridad aplicados:
 * - El ID token se verifica con la libreria oficial de Google, que valida
 *   firma, audience y expiracion internamente.
 * - Se exige email_verified = true para rechazar cuentas sin email confirmado.
 * - El JWT emitido solo contiene userId y email (sin roles ni datos sensibles).
 * - Los errores de verificacion se unifican en un mensaje generico para no
 *   filtrar informacion sobre el fallo concreto al cliente.
 */
router.post('/google', async (req, res) => {
    const { credential } = req.body;

    // Validacion de presencia del campo antes de cualquier operacion costosa
    if (!credential || typeof credential !== 'string') {
        return res.status(400).json({ error: 'credential es requerido' });
    }

    try {
        // verifyIdToken valida: firma RS256, audience (client_id), expiracion y
        // que el token provenga de los servidores de Google (iss claim).
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        // El claim "email" puede estar ausente en cuentas de G Suite legacy
        if (!email) {
            return res.status(400).json({ error: 'La cuenta de Google no tiene email' });
        }

        // Rechazar cuentas cuyo email no haya sido verificado por Google.
        // Esto previene que un atacante con un token de cuenta no verificada
        // pueda suplantarse como el propietario legitimo de ese correo.
        if (!email_verified) {
            return res.status(400).json({ error: 'El email de Google no esta verificado' });
        }

        // findOrCreateUserByGoogle usa sentencias preparadas internamente;
        // no hay interpolacion de strings en las queries (prevencion SQL injection).
        const user = findOrCreateUserByGoogle({
            googleId,
            email,
            displayName: name || email.split('@')[0],
            avatarUrl: picture || null,
        });

        // JWT minimalista: solo los claims necesarios para identificar al usuario.
        // No se incluyen roles, permisos ni datos personales adicionales para
        // reducir el impacto si el token es interceptado.
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        return res.json({
            success: true,
            token,
            user: formatUser(user),
        });
    } catch (err) {
        // El error se registra en servidor con detalle completo para depuracion,
        // pero el cliente solo recibe un mensaje generico para no revelar si el
        // fallo fue de firma, expiracion, audience incorrecto, etc.
        console.error('Google auth error:', err);
        return res.status(401).json({ error: 'Token de Google invalido' });
    }
});

/**
 * GET /api/auth/me
 * Devuelve los datos publicos del usuario autenticado.
 * requireAuth valida el JWT de la cabecera Authorization: Bearer <token>
 * y adjunta req.user con los datos del usuario consultados desde la BD.
 */
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Placeholder stateless: el cliente debe descartar el JWT localmente.
 * En una arquitectura con lista negra de tokens esto invalidaria el JTI.
 * requireAuth se mantiene para confirmar que el token todavia es valido
 * en el momento del logout (evita peticiones anonimas al endpoint).
 */
router.post('/logout', requireAuth, (req, res) => {
    res.json({ success: true });
});

export default router;
