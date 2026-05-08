import express from 'express';
import exerciseController from '../controllers/exerciseController.js';
import webPush from 'web-push';

let router = express.Router();

// Configuración VAPID
let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
    const keys = webPush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    console.log('\n🔑 [VAPID] Claves generadas automáticamente para desarrollo:');
    console.log('Public Key:', publicKey);
    console.log('Guárdalas en tu archivo .env para que sean persistentes.\n');
}

webPush.setVapidDetails(
    'mailto:tu-email@ejemplo.com',
    publicKey,
    privateKey
);

let subscriptions = [];

router.get('/exercises', exerciseController.getExercises);
router.post('/translate', exerciseController.translate);

// Endpoint para obtener la clave pública
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey });
});

// Endpoint para suscribirse
router.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
});

// Endpoint para enviar notificación de prueba
router.post('/notify', (req, res) => {
    const payload = JSON.stringify({
        title: "🤖 Coach Titán",
        body: "Tu misión de hoy te espera. ¡Levántate y a entrenar!",
        icon: "/icons/icon-192.png"
    });

    const notifications = subscriptions.map(sub => 
        webPush.sendNotification(sub, payload)
            .catch(err => console.error('Error enviando notificación:', err))
    );

    Promise.all(notifications)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ error: err.message }));
});

export default router;
