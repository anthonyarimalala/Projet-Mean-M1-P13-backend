const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      role,
      nom,
      prenom,
      email,
      password,
      telephone,
      is_active,
      is_deleted,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      role, // "ADMIN", "BOUTIQUE" ou "ACHETEUR"
      nom,
      prenom,
      email,
      password: hashedPassword, // toujours hashé
      telephone,
      is_active: is_active ?? true,
      is_deleted: is_deleted ?? false,
    });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔑 sélectionner le password même si select: false
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Identifiants invalides" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Identifiants invalides" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un utilisateur
router.put(
  "/users/:id",
  auth,
  roleMiddleware("ADMIN", "BOUTIQUE"),
  async (req, res) => {
    try {
      const { id } = req.params; // _id de l'utilisateur à mettre à jour
      const {
        role,
        nom,
        prenom,
        email,
        password,
        telephone,
        is_active,
        is_deleted,
      } = req.body;

      // Préparer l'objet de mise à jour
      const updateData = {
        role,
        nom,
        prenom,
        email,
        telephone,
        is_active,
        is_deleted,
      };

      // Si le mot de passe est fourni, le hasher
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Mettre à jour l'utilisateur
      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true, // renvoie l'utilisateur mis à jour
        runValidators: true, // applique les validations du schéma
      });

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({
        message: "Utilisateur mis à jour",
        user: {
          _id: user._id,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          is_active: user.is_active,
          is_deleted: user.is_deleted,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  "/users",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 });

      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
