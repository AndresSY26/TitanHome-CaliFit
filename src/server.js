import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

let __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);

let app = express();
let PORT = process.env.PORT || 3000;

// Configuración de Seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "https://raw.githubusercontent.com", "data:", "https://images.unsplash.com"],
            "connect-src": ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}));
app.use(cors());
app.use(express.json());

// Limitador de peticiones para la API
let limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Motor de Plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api', apiRoutes);
app.get('/', (req, res) => res.render('index'));

app.listen(PORT, () => console.log(`\n🚀 TitanHome CaliFit - Arquitectura Robusta Activa\n🔗 URL: http://localhost:${PORT}\n`));
