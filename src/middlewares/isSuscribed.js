const Follow = require ('../models/followModels');
exports.isSubscribed = async (req, res, next) => {
    const userId = req.user.id;
    const profileId = req.params.id;

    try {
        const follow = await Follow.findOne({
            user: userId,
            followed: profileId,
        });

        if (follow) {
            next(); // Permitir el acceso al perfil si hay un follow
        } else {
            return res.status(403).send({
                status: "error",
                message: "Debes estar suscrito para ver este perfil",
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al verificar la suscripción",
        });
    }
};