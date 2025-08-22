// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const userRoutes = require('./src/routes/userRoutes');
const followRoutes = require('./src/routes/followRoutes');
const publicationRoutes = require('./src/routes/publicationRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

const app = express();

// —— Lista blanca de orígenes que pueden llamar a tu API ——
// PON AQUÍ tu dominio del FRONT en Railway:
const allowedOrigins = [
  'http://localhost:5173',
  'https://social-front.up.railway.app',  // <— cámbialo por el tuyo exacto
];

app.use(
  cors({
    origin: function (origin, cb) {
      // Sin origin (Postman/cURL) o en lista blanca => permitir
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // por si luego usas cookies
  })
);

// Preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);
app.use('/follow', followRoutes);
app.use('/publication', publicationRoutes);
app.use('/subscription', subscriptionRoutes);

// Healthcheck sencillo
app.get('/', (req, res) => res.status(200).send('OK'));
app.get('/ruta-prueba', (req, res) => {
  return res.status(200).json({ id: 1, nombre: 'nahuel' });
});

module.exports = app;


// require('dotenv').config();
// const express= require('express');
// const app = express();
// const cors = require ('cors');
// const userRoutes = require('./src/routes/userRoutes');
// const followRoutes = require('./src/routes/followRoutes');
// const publicationRoutes = require('./src/routes/publicationRoutes');
// const subscriptionRoutes = require('./src/routes/subscriptionRoutes');


// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({extended:true}));
// app.use('/user', userRoutes);
// app.use('/follow', followRoutes);
// app.use('/publication', publicationRoutes);
// app.use('/subscription', subscriptionRoutes);

// app.get('/ruta-prueba',(req,res)=>{
// return res.status(200).json({
//     "id":1,
//     "nombre":"nahuel"
// })
// });

// module.exports =
//     app
// ;