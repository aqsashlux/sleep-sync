import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import { config } from './config.js';

const app = express();

const ALLOWED_ORIGINS = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow desktop/file and non-browser requests (origin can be empty)
        if (!origin) return callback(null, true);
        return callback(null, ALLOWED_ORIGINS.has(origin));
    },
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Inicializar base de datos
initDatabase();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

app.listen(config.PORT, '127.0.0.1', () => {
    console.log(`Sync backend running on http://127.0.0.1:${config.PORT}`);
});
