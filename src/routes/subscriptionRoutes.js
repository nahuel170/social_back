const express = require('express');
const router = express.Router();
const { createSubscription, subscriptionStatus } = require('../controllers/subscriptionControllers');
const  authMiddleware  = require('../middlewares/auth'); // Asegúrate de que el usuario esté autenticado

// Ruta para crear la suscripción (preapproval)
router.post('/create', authMiddleware.auth, createSubscription);

// Ruta para consultar el estado de suscripción (opcional)
router.get('/status', authMiddleware.auth, subscriptionStatus);

module.exports = router;