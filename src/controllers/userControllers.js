const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/userModels');
const Follow = require('../models/followModels');
const Publication = require('../models/publicationModels');
const jwt = require('../helpers/jwt');
const mongoosePaginate = require('mongoose-paginate-v2');
const fs = require('fs');
const path = require('path');
const followService = require('../helpers/followService');
const validate = require('../helpers/validate');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId; // Define correctamente ObjectId



// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    });
}
// const bcrypt = require('bcrypt');
// const User = require('../models/userModels');
// const validate = require('../helpers/validate');

// exports.registrarUser = async (req, res) => {
//   const { nombre, email, password, nick, rol } = req.body;

//   // 1) Validación básica
//   if (!nombre || !email || !password || !nick) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Faltan datos por enviar (nombre, email, password, nick).'
//     });
//   }

//   // 2) Validación de formato, etc.
//   try {
//     validate(req.body);
//   } catch (err) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Validación de datos no superada.'
//     });
//   }

//   try {
//     // 3) Comprobar duplicados
//     const existing = await User.findOne({
//       $or: [
//         { email: email.toLowerCase() },
//         { nick: nick.toLowerCase() }
//       ]
//     });
//     if (existing) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'El email o nick ya está en uso.'
//       });
//     }

//     // 4) Cifrar contraseña y guardar
//     const hash = await bcrypt.hash(password, 10);
//     const newUser = new User({ nombre, email: email.toLowerCase(), password: hash, nick, rol });
//     const saved = await newUser.save();

//     // 5) Respuesta exitosa
//     return res.status(201).json({
//       status: 'success',
//       message: 'Usuario registrado correctamente.',
//       user: saved
//     });

//   } catch (err) {
//     console.error('Error interno en registrarUser:', err);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Error interno del servidor.'
//     });
//   }
// };
const registrarUser = async (req, res) => {

    let params = req.body;

    // Comprobar que me llegan bien (+ validacion)
    if (!params.nombre || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar",
        });
    }
    console.log('params', params);
    try {
        validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Valición no superada",
        });
    }

    // Control usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    }).then(async (users) => {
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        }

        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        // Crear objeto de usuario
        let user_to_save = new User(params);

        // Guardar usuario en la bbdd
        user_to_save.save().then((userStored) => {
            if (!userStored) return res.status(500).send({ status: "error", "message": "Error al guardar el ususario" });
            return res.status(200).json({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored
            });

        });
    });
};
const login = async (req, res) => {
    const params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    try {
        const usuario = await User.findOne({ email: params.email });


        if (!usuario) return res.status(400).send({
            status: "error",
            message: "No existe el usuario"
        })
        const pwd = bcrypt.compareSync(params.password, usuario.password);
        if (!pwd) {
            return res.status(400).send({
                status: "error",
                mesage: "Password incorrecto"
            })
        }
        const token = jwt.createToken(usuario);
        return res.status(200).send({
            status: "success",
            message: "Te has logeado correctamente",
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                nick: usuario.nick
            },
            token
        })

    } catch (error) {

    };
};

const getUser = async (req, res) => {
    const id = req.params.id;

    try {
        const usuario = await User.findById(id).select({ password: 0 });
        if (!usuario) {
            return res.status(404).send({
                status: "error",
                message: "El usuario no existe o hay un error"
            });
        }

        const followInfo = await followService.followThisUser(req.user.id, id);

            return res.status(200).send({
            status: "success",
            usuario,
            following: followInfo.following,
            followers: followInfo.followers,
            // counters: countersInfo // Asegúrate de que esto esté bien estructurado
        });
    } catch (error) {
        console.error("Error en getUser :", error);
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el usuario"
        });
    }
};
const list = async (req, res) => {
    try {
        // Controlar en qué página estamos
        let page = 1;
        if (req.params.page) {
            page = req.params.page;
        }
        page = parseInt(page);

        // Definir el número de items por página
        const itemsPerPage = 5;

        // Realizar la consulta con mongoose paginate
        const result = await User.paginate({}, {

            select: "-password -email -role -__v",
            sort: { _id: 1 },
            page,
            limit: itemsPerPage
        });

        // Si no hay usuarios
        if (!result.docs || result.docs.length === 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles"
            });
        }

        // Sacar un array de ids de los usuarios que me siguen y los que sigo
        let followUserIds = await followService.followUserIds(req.user.id);


        // Devolver el resultado
        return res.status(200).send({
            status: "success",
            users: result.docs,
            page,
            itemsPerPage,
            total: result.totalDocs,
            pages: result.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en la petición",
            error
        });
    }
};
const update = (req, res) => {

    const userIdentity = req.user;
    const userToUpdate = req.body;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.imagen;

    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).then(async (users) => {
        let userIsset = false;
        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true;
        });
        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        } else {
            delete userToUpdate.password
        }

        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        }
        try {
            const userUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true });

            if (!userUpdated) {
                return res.status(400).json({ status: "error", message: "Error al actualizar" });
            }
        } catch (error) {
            return res.status(500).send({
                status: "error",
                message: "Error al actualizar usuario",

            });
        }
        return res.status(200).send({
            status: "success",
            message: "Metodo de actualizar usuario",
            user: userToUpdate
        });
    });
};
const upload = async (req, res) => {
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Peticion no incluye imagen"
        });
    }
    let imagen = req.file.originalname;

    const imagenSplit = imagen.split("\.");
    const extension = imagenSplit[1];

    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {
        //borrar archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);
        return res.status(400).send({
            status: "error",
            message: "Extension del fichero invalida"
        });
    }
    const userUpdated = await User.findByIdAndUpdate(req.user.id, { imagen: req.file.filename }, { new: true });
    if (!userUpdated) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida del avatar"
        });
    }
    return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file
    });
}
const avatar = (req, res) => {
    const file = req.params.file;

    // Generar la ruta correctamente
    const filePath = path.join(__dirname, '..', 'uploads', 'avatars', file);

    // Comprobar si el archivo existe
    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }
        // Enviar el archivo si existe
        return res.sendFile(path.resolve(filePath));
    });
};

const counters = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id); // Usa 'new' aquí

        // Resto de la lógica para calcular contadores, por ejemplo:
        const followingCount = await Follow.countDocuments({ user: userId });
        const followersCount = await Follow.countDocuments({ followed: userId });
        const publicationsCount = await Publication.countDocuments({ user: userId });

        const totalLikesCount = await Publication.aggregate([
            { $match: { user: userId } },
            { $unwind: '$likes' },
            { $count: 'totalLikes' }
        ]);

        res.json({
            following: followingCount,
            followers: followersCount,
            publications: publicationsCount,
            likesTotal: totalLikesCount[0]?.totalLikes || 0
        });
    } catch (error) {
        console.error("Error fetching counters:", error);
        res.status(500).json({ message: 'Error fetching counters', error });
    }
};
const topLikes = async (req, res) => {
    try {
        // Realizar agregación en las publicaciones para contar los likes por usuario
        const topUsers = await Publication.aggregate([
            { $unwind: "$likes" }, // Desglosar cada like en un documento individual
            { $group: { _id: "$user", totalLikes: { $sum: 1 } } }, // Agrupar por usuario y contar likes
            { $sort: { totalLikes: -1 } }, // Ordenar de mayor a menor
            { $limit: 10 } // Limitar a los 10 primeros
        ]);

        // Incluir el campo 'imagen' en el populate
        const usersWithLikes = await User.populate(topUsers, { path: "_id", select: "nombre nick imagen" });

        return res.status(200).json({
            status: "success",
            users: usersWithLikes
        });
    } catch (error) {
        console.error("Error fetching top users by likes:", error);
        return res.status(500).json({ status: "error", message: "Error fetching top users" });
    }
};
module.exports = {
    registrarUser,
    pruebaUser,
    login,
    getUser,
    list,
    update,
    upload,
    avatar,
    counters,
    topLikes
}; 