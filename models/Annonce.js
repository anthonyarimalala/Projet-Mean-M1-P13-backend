const mongoose = require("mongoose");

const AnnonceSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    emetteur: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Référence au modèle User
        required: true,
      },
      role: {
        type: String,
        enum: ["ADMIN", "BOUTIQUE", "ACHETEUR"],
        required: true,
      },
    },

    boutique_id: {
      type: String,
      default: null,
    },

    cibles: {
      type: [
        {
          type: String,
          enum: ["ROLE", "BOUTIQUE", "ACHETEUR"],
        },
      ],
      required: true,
    },

    images: [
      {
        url: { type: String, required: true, trim: true },
        alt: { type: String, trim: true },
        ordre: { type: Number, required: true },
      },
    ],

    statut: {
      type: String,
      enum: ["BROUILLON", "PUBLIEE", "ARCHIVEE"],
      default: "BROUILLON",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Annonce", AnnonceSchema);
