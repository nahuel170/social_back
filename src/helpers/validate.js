const validator = require("validator");

const validate = (params) => {
    let nombre = !validator.isEmpty(params.nombre) &&
        validator.isLength(params.nombre, { min: 3, max: undefined }) &&
        validator.isAlpha(params.nombre, "es-ES");

    let apellido = !validator.isEmpty(params.apellido) &&
        validator.isLength(params.apellido, { min: 3, max: undefined }) &&
        validator.isAlpha(params.apellido, "es-ES");

    let nick = !validator.isEmpty(params.nick) &&
        validator.isLength(params.nick, { min: 3, max: undefined })

    let email = !validator.isEmpty(params.email) &&
        validator.isEmail(params.email)

    let password = !validator.isEmpty(params.password);

    if (params.bio) {
        let bio = validator.isLength(params.bio, { min: undefined, max: 255 });
        if (!bio) {
            throw new Error("No se ha superado la validacion");
        } else {
            console.log("Validacion superada");
        }
    }

    if (!nombre || !apellido || !nick || !email || !password) {
        throw new Error("No se ha superado la validacion");
    } else {
        console.log("Validacion superada");
    }
}

module.exports =
    validate
