const Follow = require('../models/followModels');
const User = require('../models/userModels');
const mongoosePaginate = require('mongoose-paginate-v2');
const followService = require('../helpers/followService');
const { getIO } = require('../sockets'); // (SOCKET.IO)

const save = (req, res) => {
    const params = req.body;

    const identity = req.user;

    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    });

    userToFollow.save().then((followStored) => {
        if (!followStored) {
            return res.status(500).send({
                status: "error",
                message: "No se ha podido seguir al usuario"
            });
        }
    });
    getIO().emit('followedUser', {
        followerId: identity.id,
        followedId: params.followed,
    });
    return res.status(200).send({
        status: "success",
        message: "metodo de follow",
        identity: req.user,
        userToFollow

    })
};
const unFollow = async (req, res) => {
    const userId = req.user.id;
    const followedId = req.params.id;

    try {
        const followDeleted = await Follow.deleteOne({
            "user": userId,
            "followed": followedId
        });

        if (followDeleted.deletedCount === 0) {
            return res.status(500).send({
                status: "error",
                message: "No has dejado de seguir a nadie"
            });
        }
        getIO().emit('userUnfollowed', {
            followerId: userId,
            unfollowedId: followedId,
        });
        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al intentar dejar de seguir",
            error
        });
    }
};
const following = async (req, res) => {
    let userId = req.user.id;
    if (req.params.id) userId = req.params.id;

    let page = 1;
    if (req.params.page) page = parseInt(req.params.page);

    const itemsPerPage = 5;

    try {
        const options = {
            page: page,
            limit: itemsPerPage,
            populate: { path: "user followed", select: "-password -role -__v -email" }
        };

        // Realizar la paginación
        const result = await Follow.paginate({ user: userId }, options);

        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo",
            followed: result.docs,
            total: result.totalDocs,
            pages: result.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener la lista de seguidos",
            error
        });
    }
};
const followers = async (req, res) => {

    let userId = req.user.id;
    if (req.params.id) userId = req.params.id;

    let page = 1;
    if (req.params.page) page = parseInt(req.params.page);

    const itemsPerPage = 5;
    try {
        const options = {
            page: page,
            limit: itemsPerPage,
            populate: { path: "user", select: "-password -role -__v -email" }
        };

        // Realizar la paginación
        const result = await Follow.paginate({ followed: userId }, options);

        let followUserIds = await followService.followUserIds(req.user.id);
        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me siguen",
            follows: result.docs,
            total: result.totalDocs,
            pages: result.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener la lista de seguidos",
            error
        });
    }
};
module.exports = {
    save,
    unFollow,
    following,
    followers,
}