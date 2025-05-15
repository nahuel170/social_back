const Follow = require ('../models/followModels');
const User = require('../models/userModels');
const mongoosePaginate = require('mongoose-paginate-v2');
const followService = require('../helpers/followService');
const { getIO } = require('../sockets'); // (SOCKET.IO)

const save = (req, res) =>{
    const params = req.body;

    const identity = req.user;

    let userToFollow = new Follow({
            user: identity.id,
        followed: params.followed
    });
    
    userToFollow.save().then((followStored) =>{
            if(!followStored){
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

// const mercadopago = require('mercadopago');

// // Setea el access_token directamente
// mercadopago.access_token = 'TEST-3893473638302181-102218-eca1bbdd98439cd2ddc7bb736d013c02-790525566';

// const subscribeAndFollow = async (req, res) => {
//     const { followedUserId } = req.body;
//     const userId = req.user.id;

//     try {
//         // Crear la preferencia de pago en Mercado Pago
//         const preference = await mercadopago.preferences.create({
//             items: [
//                 {
//                     title: 'Suscripción mensual',
//                     unit_price: 2,
//                     quantity: 1,
//                     currency_id: 'ARS' // Cambia a la moneda que necesites
//                 }
//             ],
//             payer: {
//                 email: req.user.email
//             },
//             back_urls: {
//                 success: 'https://tusitio.com/success',
//                 failure: 'https://tusitio.com/failure',
//                 pending: 'https://tusitio.com/pending'
//             },
//             auto_return: 'approved'
//         });

//         // Guardar la relación de seguimiento en la base de datos
//         const userToFollow = new Follow({
//             user: userId,
//             followed: followedUserId,
//             preferenceId: preference.body.id // Almacenar el ID de la preferencia
//         });

//         const followStored = await userToFollow.save();

//         if (!followStored) {
//             return res.status(500).send({
//                 status: "error",
//                 message: "No se ha podido seguir al usuario"
//             });
//         }

//         // Retornar la preferencia de Mercado Pago
//         return res.status(200).send({
//             status: "success",
//             message: "Suscripción creada y siguiendo al usuario",
//             preferenceId: preference.body.id // Este ID es para redirigir al usuario a la pasarela de pago
//         });
//     } catch (error) {
//         console.error('Error al suscribirse y seguir:', error);
//         return res.status(500).send({
//             status: "error",
//             message: "Error al suscribirse y seguir",
//             error
//         });
//     }
// };
// const unsubscribeAndUnfollow = async (req, res) => {
//     const userId = req.user.id;
//     const followedUserId = req.params.id;

//     try {
//         // Aquí debes obtener el ID de la preaprobación que se guardó en tu base de datos
//         const followRecord = await Follow.findOne({ user: userId, followed: followedUserId });

//         if (!followRecord) {
//             return res.status(500).send({
//                 status: "error",
//                 message: "No se ha encontrado la relación de seguimiento"
//             });
//         }

//         // Cancelar la suscripción en Mercado Pago
//         await mercadopago.preapproval.cancel(followRecord.preapprovalId);

//         // Eliminar la relación de seguimiento de la base de datos
//         const followDeleted = await Follow.deleteOne({
//             user: userId,
//             followed: followedUserId
//         });

//         if (followDeleted.deletedCount === 0) {
//             return res.status(500).send({
//                 status: "error",
//                 message: "No se ha encontrado la suscripción para cancelar"
//             });
//         }

//         return res.status(200).send({
//             status: "success",
//             message: "Suscripción cancelada y seguimiento eliminado"
//         });
//     } catch (error) {
//         console.error('Error al cancelar la suscripción y dejar de seguir:', error);
//         return res.status(500).send({
//             status: "error",
//             message: "Error al cancelar la suscripción y dejar de seguir",
//             error
//         });
//     }
// };