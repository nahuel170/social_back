const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const publicationSchema = new Schema({
        user:{
            type: Schema.ObjectId,
            ref: "User"
        },
        text:{
            type: String,
            required: true
        },
        file: String,
        created_at:{
                type: Date,
                default: Date.now
        },
        likes: [
            {
                type: Schema.ObjectId,
                ref: 'User',
                default: [],
            }
        ]
})
publicationSchema.plugin(mongoosePaginate);
 module.exports= mongoose.model('Publication',publicationSchema);