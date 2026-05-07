import express from 'express';
import exerciseController from '../controllers/exerciseController.js';

let router = express.Router();

router.get('/exercises', exerciseController.getExercises);
router.post('/translate', exerciseController.translate);

export default router;
