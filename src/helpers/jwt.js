const jwt = require("jwt-simple");
const moment = require("moment");

const secret = process.env.JWT_SECRET;

const createToken = (usuario) => {
    const payload = {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nick: usuario.nick,
        email: usuario.email,
        role: usuario.role,
        imagen: usuario.imagen,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix()
    };
    return jwt.encode(payload, secret);
}
module.exports = {
    secret,
    createToken,


}