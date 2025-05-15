const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const followSchema = new Schema({
        user:{
            type: Schema.ObjectId,
            ref: "User"
        },
        followed:{
            type: Schema.ObjectId,
            ref: "User" 
        },
        created_at:{
                type: Date,
                default: Date.now
        }
})
 followSchema.plugin(mongoosePaginate);
 module.exports= mongoose.model('Follow',followSchema);