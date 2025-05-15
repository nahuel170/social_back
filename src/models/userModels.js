const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new Schema({
        nombre:{
                 type:String, required:true
        },
        apellido:{
                type:String, required:true
        },
        nick:{
                type:String, required:true
        },
        email:{
                type:String, required:true
        },
        password:{
            type:String, required:true
        },
        bio:{
                type:String
        },
        rol:{
                type:String, 
        },
        imagen:{
                type:String, default:"default.png"
        },
        created_at:{
                type:Date, default:Date.now
        }
})
userSchema.plugin(mongoosePaginate);
 module.exports= mongoose.model('User',userSchema);