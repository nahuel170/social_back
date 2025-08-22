// src/sockets.js
const { Server } = require('socket.io');

let io;

function init(server) {
  io = new Server(server, {
    // MUY IMPORTANTE: mismo path que usa el cliente
    path: '/socket.io',

    cors: {
      origin: [
        'http://localhost:5173',
        'https://social-front.up.railway.app', // <— cámbialo por tu dominio
      ],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
}

module.exports = { init, getIO };


// const { Server } = require('socket.io');

// let io;

// function init(server) {
//   io = new Server(server, {
//     cors: {
//       origin: '*',
//     },
//   });

//   // Manejar evento de conexión
//   io.on('connection', (socket) => {
//     console.log('Nuevo cliente conectado:', socket.id);

//     socket.on('disconnect', () => {
//       console.log('Cliente desconectado:', socket.id);
//     });
//   });

//   return io;
// }

// /**
//  * Retorna la instancia de Socket.io para usarla en cualquier controlador
//  */
// function getIO() {
//   if (!io) {
//     throw new Error('Socket.io no ha sido inicializado. Llama a init(server) primero.');
//   }
//   return io;
// }

// module.exports = {
//   init,
//   getIO,
// };