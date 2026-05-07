import fetch from 'node-fetch';

let API_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

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

        try {
            let googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
            let response = await fetch(googleUrl);
            let data = await response.json();
            let translated = data[0].map(item => item[0]).join('');
            res.json({ translated });
        } catch (error) {
            res.json({ translated: text }); // Fallback al texto original en caso de error
        }
    }
};

export default exerciseController;
