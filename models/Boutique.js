const mongoose = require("mongoose");

const BoutiqueSchema = new mongoose.Schema(
  {
    _id: {
      type: String, 
      required: true,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
    },

    etage: {
      type: Number,
      required: true,
    },

    is_disponible: {
      type: Boolean,
      default: true,
    },

    prix: {
      type: Number,
      required: true,
    },

    promotion: {
      active: { type: Boolean, default: false },
      taux: { type: Number, default: 0 },
    },

    nom_boutique: {
      type: String,
      required: true,
      trim: true,
    },

    lien_site_web: {
      type: String,
      trim: true,
    },

    locataire_id: {
      type: String, 
      required: true,
      ref: "User",
    },

    date_prochain_paiement: {
      type: Date,
    },

    categories: [
      {
        type: String, 
        trim: true,
      },
    ],

    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Boutique", BoutiqueSchema);
