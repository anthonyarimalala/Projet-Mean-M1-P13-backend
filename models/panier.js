const mongoose = require("mongoose");

const ProduitPanierSchema = new mongoose.Schema({
  produit_id: { type: String, required: true, ref: "Produit" },
  quantite: { type: Number, required: true, default: 1, min: 1 },
  prix_unitaire: { type: Number, required: true },
  total_produit: { type: Number, required: true }
  produit_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: "Produit" 
  },
  quantite: { 
    type: Number, 
    required: true, 
    default: 1, 
    min: 1 
  },
  prix_unitaire: { 
    type: Number, 
    required: true 
  },
  total_produit: { 
    type: Number, 
    required: true 
  }
}, { _id: false });

const BoutiquePanierSchema = new mongoose.Schema({
  boutique_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: "Boutique" 
  },
  produits: { 
    type: [ProduitPanierSchema], 
    default: [] 
  },
  total_boutique: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const PanierSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: "User" 
  },
  boutiques: { 
    type: [BoutiquePanierSchema], 
    default: [] 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: { 
    createdAt: "created_at", 
    updatedAt: "updated_at" 
  } 
});

module.exports = mongoose.model("Panier", PanierSchema);