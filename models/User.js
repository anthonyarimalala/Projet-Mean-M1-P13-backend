const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["ADMIN", "BOUTIQUE", "ACHETEUR"],
      default: "ACHETEUR",
      required: true,
    },

    nom: {
      type: String,
      required: true,
      trim: true,
    },

    prenom: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔐 jamais exposé
    },

    telephone: {
      type: String,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

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

module.exports = mongoose.model("User", UserSchema);
