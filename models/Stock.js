const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  produit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true,
  },
  quantite: {
    type: Number,
    required: true,
    min: 0,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Stock', StockSchema);