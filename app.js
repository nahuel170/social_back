require('dotenv').config();
const express= require('express');
const app = express();
const cors = require ('cors');
const userRoutes = require('./src/routes/userRoutes');
const followRoutes = require('./src/routes/followRoutes');
const publicationRoutes = require('./src/routes/publicationRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/user', userRoutes);
app.use('/follow', followRoutes);
app.use('/publication', publicationRoutes);
app.use('/subscription', subscriptionRoutes);

app.get('/ruta-prueba',(req,res)=>{
return res.status(200).json({
    "id":1,
    "nombre":"nahuel"
})
});

module.exports =
    app
;