const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userControllers');
const check = require('../middlewares/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname,'..', 'uploads', 'avatars');
        
        // Verificar si la carpeta existe, si no, crearla
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });  // Crea la carpeta si no existe
        }

        cb(null, dir);  // Pasar la carpeta destino
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);
    }
});

const uploads = multer({storage});

router.get("/prueba-usuario", check.auth, UserController.pruebaUser);
router.post('/registro', UserController.registrarUser);
router.post('/login', UserController.login);
router.get('/getUser/:id', check.auth, UserController.getUser);
router.get('/list/:page?', check.auth, UserController.list);
router.put('/update', check.auth, UserController.update);
router.post('/upload', [check.auth, uploads.single("file0")], UserController.upload);
router.get('/avatar/:file', UserController.avatar);
router.get('/counters/:id', check.auth, UserController.counters);
router.get('/top-likes', UserController.topLikes);

module.exports = router;