const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionSchema = new Schema({
  subscriber: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendor: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  preapproval_id: { 
    type: String, 
    required: true 
  },
  transaction_amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'canceled'], 
    default: 'pending' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Opcional: Actualizar automáticamente updated_at en cada guardado
subscriptionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);