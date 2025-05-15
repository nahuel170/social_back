const express = require('express');
const router = express.Router();
const PublicationController = require('../controllers/publicationControllers');
const check = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const check2 = require('../middlewares/isSuscribed')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname,'..', 'uploads', 'publications');
        
        // Verificar si la carpeta existe, si no, crearla
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });  // Crea la carpeta si no existe
        }

        cb(null, dir);  // Pasar la carpeta destino
    },
    filename: (req, file, cb) => {
        cb(null, "pub-" + Date.now() + "-" + file.originalname);
    }
});

const uploads = multer({storage});

router.post('/save', check.auth, PublicationController.save);
router.get('/detail/:id', check.auth, PublicationController.detail);
router.delete('/deleted/:id', check.auth, PublicationController.deleted);
router.get('/listp/:id/:page?', check.auth, PublicationController.listPublication);
router.post('/upload/:id',[check.auth, uploads.single("file0")], PublicationController.upload);
router.get('/media/:file', PublicationController.media);
router.get('/feed/:page?', check.auth, PublicationController.feed);
router.post('/like/:id', check.auth, PublicationController.like);
router.post('/unlike/:id', check.auth, PublicationController.unlike);


module.exports = router;