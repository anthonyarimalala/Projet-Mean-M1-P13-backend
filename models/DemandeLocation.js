const mongoose = require("mongoose");

const DemandeLocationSchema = new mongoose.Schema(
  {
    boutique: {
      boutique_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique",
        required: true,
      },
      numero: {
        type: String,
        required: true,
        trim: true,
      },
      nom_demande: {
        type: String,
        required: true,
        trim: true,
      },
    },

    categories: {
      type: [String],
      required: true,
    },

    site_web: {
      type: String,
      trim: true,
      default: null,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    demandeur: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      nom: {
        type: String,
        trim: true,
      },
    },

    statut: {
      type: String,
      enum: ["EN_ATTENTE", "APPROUVEE", "REJETEE", "ANNULEE"],
      default: "EN_ATTENTE",
      required: true,
    },

    date_demande: {
      type: Date,
      default: Date.now,
      required: true,
    },

    traitement: {
      date_traitement: {
        type: Date,
        default: null,
      },
      traite_par: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      notes_admin: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// PAS DE MIDDLEWARE PRE-SAVE DU TOUT
// PAS DE MÉTHODES D'INSTANCE
// JUSTE LES INDEX

// Index
DemandeLocationSchema.index({ "boutique.boutique_id": 1, statut: 1 });
DemandeLocationSchema.index({ "demandeur.user_id": 1, date_demande: -1 });
DemandeLocationSchema.index({ statut: 1, date_demande: -1 });

module.exports = mongoose.model("DemandeLocation", DemandeLocationSchema);
