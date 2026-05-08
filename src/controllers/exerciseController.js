import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../data/translationsCache.json');

let API_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
let translationCache = {};

// Inicialización Sincrónica de la Caché
function initCache() {
    const dataDir = path.join(__dirname, '../data');
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            translationCache = JSON.parse(data);
            console.log('📦 Caché de traducciones cargada con éxito.');
        } else {
            fs.writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2));
            translationCache = {};
            console.log('📦 Archivo de caché creado por primera vez.');
        }
    } catch (error) {
        console.error('Error al inicializar la caché:', error);
        translationCache = {};
    }
}

initCache();

let exerciseController = {
    getExercises: async (req, res) => {
        try {
            let response = await fetch(API_URL);
            let data = await response.json();

            // Filtro Anti-Equipamiento Estricto (Solo peso corporal, min 2 imágenes)
            let forbiddenWords = ['pullup', 'pull-up', 'chin-up', 'chin up', 'muscle-up', 'muscle up', 'bar', 'smith', 'machine', 'band', 'cable', 'trx', 'ring', 'suspension', 'door'];
            
            let filtered = data.filter(ex => {
                let isBodyOnly = ex.equipment === 'body only';
                let hasImages = ex.images && ex.images.length >= 2;
                if (!isBodyOnly || !hasImages) return false;
                
                let nameLower = ex.name.toLowerCase();
                return !forbiddenWords.some(word => nameLower.includes(word));
            });

            res.json(filtered.map((ex, idx) => ({ ...ex, id: idx })));
        } catch (error) {
            console.error('Error fetching exercises:', error);
            res.status(500).json({ error: 'Error cargando la base de datos de ejercicios' });
        }
    },

    translate: async (req, res) => {
        let { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No se proporcionó texto para traducir' });

        // Capa de Caché
        if (translationCache[text]) {
            return res.json({ translated: translationCache[text] });
        }

        try {
            let googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
            let response = await fetch(googleUrl);
            let data = await response.json();
            let translated = data[0].map(item => item[0]).join('');
            
            // Guardar en Caché en memoria
            translationCache[text] = translated;
            
            // Guardar en disco de forma asíncrona (no bloqueante)
            fs.promises.writeFile(CACHE_FILE, JSON.stringify(translationCache, null, 2))
                .catch(err => console.error('Error al guardar la caché en disco:', err));

            res.json({ translated });
        } catch (error) {
            res.json({ translated: text }); // Fallback al texto original en caso de error
        }
    }
};

export default exerciseController;
