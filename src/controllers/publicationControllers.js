const Publication = require('../models/publicationModels');
const fs = require('fs');
const path = require('path');
const followService = require('../helpers/followService');
const { getIO } = require('../sockets'); // (SOCKET.IO) Importar la instancia de socket
const User = require('../models/userModels');

const save = async (req, res) => {
    const params = req.body;

    // Verificar si hay un texto en la publicación
    if (!params.text) {
        return res.status(400).send({
            status: "error",
            message: "Debes enviar el texto de la publicación",
        });
    }

    // Crear la publicación y asignar el usuario
    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Si no existe newPublication.likes, inicializar a []
    if (!newPublication.likes) {
        newPublication.likes = [];
    }
    // Agregar el nombre del archivo si existe
    if (req.file && req.file.filename) {
        newPublication.file = req.file.filename;
    }

    // Guardar la publicación
    newPublication.save().then(async (publicationStored) => {
        if (!publicationStored) {
            return res.status(400).send({
                status: "error",
                message: "Error al guardar la publicación",
            });
        }
        const populated = await Publication.findById(publicationStored._id)
            .populate('user', '-password -__v -rol -email');

        getIO().emit('publicationCreated', populated);

        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored: populated
        });
    })
        .catch((error) => {
            return res.status(500).send({
                status: "error",
                message: "Error interno al guardar la publicación",
                error
            });
        });
};
const detail = async (req, res) => {
    const publicationId = req.params.id;

    const publicationStored = await Publication.findById(publicationId)
    if (!publicationStored) {
        return res.status(404).send({
            status: "error",
            message: "No existe la publicacion"
        });
    };

    return res.status(200).send({
        status: "success",
        message: "Mostrar publicacion ",
        publication: publicationStored
    });
};
const deleted = async (req, res) => {
    const publicationId = req.params.id;
    try {
        const publicacionDeleted = await Publication.deleteOne({ "user": req.user.id, "_id": publicationId });
        if (!publicacionDeleted) {
            return res.status(500).send({
                status: "error",
                message: "No se ha eliminado la publicacion"
            });
        };
        getIO().emit('publicationDeleted', {
            publicationId
        });

        return res.status(200).send({
            status: "success",
            message: "Eliminar publicacion ",
            publicationId
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al intentar dejar de seguir",
            error
        });
    }
};
const listPublication = async (req, res) => {
    try {
        const userId = req.params.id;

        let page = 1;
        if (req.params.page) page = parseInt(req.params.page);

        const itemsPerPage = 5;

        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { created_at: -1 },  // Ordenar por fecha de creación descendente
            populate: { path: 'user', select: '-password -__v -rol -email' }
        };

        const result = await Publication.paginate({ "user": userId }, options);

        if (!result.docs || result.docs.length <= 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
            page,
            total: result.totalDocs,
            pages: result.totalPages,
            publications: result.docs
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener las publicaciones",
            error
        });
    }
};
const upload = async (req, res) => {
    const publicationId = req.params.id;

    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Peticion no incluye imagen"
        });
    }

    let imagen = req.file.originalname;
    const extension = imagen.split('.').pop();

    // Validar la extensión del archivo
    if (!["png", "jpg", "jpeg", "gif"].includes(extension)) {
        fs.unlinkSync(req.file.path); // Borrar archivo si la extensión es inválida
        return res.status(400).send({
            status: "error",
            message: "Extension del fichero invalida"
        });
    }

    // Actualizar la publicación con el nombre del archivo
    const publicationUpdated = await Publication.findByIdAndUpdate(
        publicationId,
        { file: req.file.filename },
        { new: true }
    );

    if (!publicationUpdated) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida de la imagen"
        });
    }

    return res.status(200).send({
        status: "success",
        publicationUpdated, // Debería contener el campo 'file'
        file: req.file.filename
    });
};
const media = (req, res) => {
    const file = req.params.file;

    // Generar la ruta correctamente
    const filePath = path.join(__dirname, '..', 'uploads', 'publications', file);

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
const feed = async (req, res) => {
    let page = 1;
    if (req.params.page) { page = req.params.page };

    let itemsPerPage = 5;
    try {
        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { created_at: -1 },  // Ordenar por fecha de creación descendente
            populate: { path: 'user', select: '-password -__v -rol -email' }
        };

        const myFollows = await followService.followUserIds(req.user.id);

        const publications = await Publication.paginate({ user: myFollows.following }, options);
        if (!publications) {
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            });
        }
        return res.status(200).send({
            status: "success",
            message: "Feed de publicaciones",
            following: myFollows.following,
            page,
            total: publications.totalDocs,
            pages: publications.totalPages,
            publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener usuarios que sigues",
        });
    }
};
const like = async (req, res) => {
    const publicationId = req.params.id;
    const userId = req.user.id;

    try {
        // Buscar la publicación por ID
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).send({
                status: 'error',
                message: 'Publicación no encontrada'
            });
        }

        // Verificar si el usuario ya ha dado like a la publicación
        if (!publication.likes.includes(userId)) {
            publication.likes.push(userId);
            await publication.save();
        }
        getIO().emit('publicationLiked', {
            publicationId,
            userId,
            // Si quieres, manda también el recuento de likes o lo que necesites
            totalLikes: publication.likes.length,
            authorId: publication.user.toString() // <--- Añade el "autor" de la publicación
        });

        // Calcular el top 10 de usuarios
        const topUsers = await Publication.aggregate([
            { $unwind: "$likes" },
            { $group: { _id: "$user", totalLikes: { $sum: 1 } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 }
        ]);
        // Hacer populate para incluir nombre, nick, imagen
        const usersWithLikes = await User.populate(topUsers, { path: "_id", select: "nombre nick imagen" });

        console.log("Emitiendo topLikesUpdated con:", usersWithLikes);

        // Emitir el evento para actualizar el top likes
        getIO().emit('topLikesUpdated', { topLikes: usersWithLikes });

        return res.status(200).send({
            status: 'success',
            publication
        });
    } catch (error) {
        return res.status(500).send({
            status: 'error',
            message: 'Error al dar me gusta',
            error
        });
    }
};

const unlike = async (req, res) => {
    const publicationId = req.params.id;
    const userId = req.user.id;

    try {
        // Buscar la publicación por ID
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).send({
                status: 'error',
                message: 'Publicación no encontrada'
            });
        }

        // Remover el usuario de la lista de likes si ya ha dado like
        publication.likes = publication.likes.filter(id => id.toString() !== userId);
        await publication.save();

        getIO().emit('publicationUnliked', {
            publicationId,
            userId,
            totalLikes: publication.likes.length,
            authorId: publication.user.toString()
        });

        // Calcular el top 10 de usuarios (igual que en la función like)
        const topUsers = await Publication.aggregate([
            { $unwind: "$likes" },
            { $group: { _id: "$user", totalLikes: { $sum: 1 } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 }
        ]);
        // Asegúrate de que el modelo User esté importado para poder hacer el populate
        const usersWithLikes = await User.populate(topUsers, { path: "_id", select: "nombre nick imagen" });

        // Emitir el evento para actualizar el top likes
        getIO().emit('topLikesUpdated', { topLikes: usersWithLikes });


        return res.status(200).send({
            status: 'success',
            publication
        });
    } catch (error) {
        return res.status(500).send({
            status: 'error',
            message: 'Error al quitar el me gusta',
            error
        });
    }
};
module.exports = {
    save,
    detail,
    deleted,
    listPublication,
    upload,
    media,
    feed,
    like,
    unlike
}