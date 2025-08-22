// index.js
const app = require('./app');
require('./src/dataBase/connection');             // solo con importarlo ya conecta
const { init } = require('./src/sockets');

const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // útil en Railway/Heroku/NGINX detrás de proxy

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

init(server);

server.on('error', (err) => {
  console.log(`server error:${err}`);
});


// // index.js
// const app = require('./app');
// const connection = require('./src/dataBase/connection'); // Tu conexión a la BBDD
// const { init } = require('./src/sockets'); // Importamos la función init de sockets
// const PORT = process.env.PORT||3000;

// // 1) Levantamos el servidor HTTP con Express
// const server = app.listen(PORT,'0.0.0.0', () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });

// // 2) Iniciamos Socket.io usando la instancia de servidor
// init(server);

// // 3) Opcional: Manejo de errores
// server.on('error', (err) => {
//   console.log(`server error:${err}`);
// });

// // const app = require('./app');
// // const connection = require('./src/dataBase/connection');
// // const PORT = 3000;



// // const server = app.listen(PORT,()=>{
// //     console.log(`servidor corriendo en el puerto: http://localhost:${PORT}`);
// // }) ;
// //     server.on('error',(err)=>{
// //         console.log(`server error:${err}`);
// //     });
