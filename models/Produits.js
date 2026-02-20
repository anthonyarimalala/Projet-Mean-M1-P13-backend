const mongoose = require("mongoose");

const ProduitSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    boutique_id: {
      type: String,
      required: true,
      ref: "Boutique",
    },

    nom: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    prix_vente: {
      type: Number,
      required: true,
    },

    prix_promo: {
      type: Number,
      default: 0,
    },

    en_vente: {
      type: Boolean,
      default: true,
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    categorie_id: {
      type: String,
      required: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Produit", ProduitSchema);
