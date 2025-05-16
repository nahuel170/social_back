const { Server } = require('socket.io');

let io;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  // Manejar evento de conexión
  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
}

/**
 * Retorna la instancia de Socket.io para usarla en cualquier controlador
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a init(server) primero.');
  }
  return io;
}

module.exports = {
  init,
  getIO,
};