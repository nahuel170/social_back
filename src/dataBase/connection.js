const mongoose = require ('mongoose');

 const urlAtlas= process.env.MONGO_URI
const conexion = mongoose.connect(urlAtlas).then(()=>{
    console.log('conectado a la base de datos')
},
    err =>{
        console.log('error al conectar a la base de datos',err);
    }
)

module.exports =
    conexion
;