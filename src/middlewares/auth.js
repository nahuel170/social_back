const jwt = require('jwt-simple');
const moment = require('moment');
const libjwt = require('../helpers/jwt')
const secret = libjwt.secret;
// comprobar si me llega la cabecera de auth
exports.auth = (req, res, next)=>{
    if(!req.headers.authorization){
        return res.status(403).send({
            status:"error",
            message:"la peticion no tiene la cabecera de autenticacion"
        });
    }
// limpiar el token
let token = req.headers.authorization.replace(/['"]+/g, '');

//decodificar token
try{
    let payload= jwt.decode(token, secret);

    //comprobar expiracion del token
    if(payload.exp <= moment().unix()){
        return res.status(401).send({
            status:"error",
            message:"toekn expirado"
        });
    }
    //agregar datos de usuario a request
    req.user = payload;
    
}catch(error){
    return res.status(404).send({
        status:"error",
        message:"token invalido",
        error
    });
}
//pasar a ejecucion de accion
next();
}