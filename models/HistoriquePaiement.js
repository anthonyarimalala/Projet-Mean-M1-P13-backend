const mongoose = require("mongoose");

const HistoriquePaiementSchema = new mongoose.Schema(
  {
    boutique_id: {
      type: String,
      required: true,
      ref: "Boutique",
    },

    locataire_id: {
      type: String,
      required: true,
      ref: "User",
    },

    montant: {
      type: Number,
      required: true,
    },

    date_prevue: { // Date prévue pour le paiement
      type: Date,
      required: true,
    },

    date_paiement: { // Date réelle de paiement
      type: Date,
    },

    mode_paiement: {
      type: String,
      enum: ["CASH", "VIREMENT", "CARTE", "MOBILE_MONEY"],
      default: "CASH",
    },

    statut: {
      type: String,
      enum: ["EN_ATTENTE", "PAYE", "ANNULE"],
      default: "EN_ATTENTE",
    },

    note: {
      type: String,
      trim: true,
    },

    show_to_user: {
      type: Boolean,
      default: true,
    },

    payeur: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("HistoriquePaiement", HistoriquePaiementSchema);