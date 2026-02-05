const express = require("express");
const router = express.Router();
const Boutique = require("../models/Boutique"); 

// =====================================
// 🔹 CREATE - Ajouter une boutique
// POST /boutiques
// =====================================
router.post("/", async (req, res) => {
  try {
    const boutique = new Boutique(req.body);
    const savedBoutique = await boutique.save();
    res.status(201).json(savedBoutique);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// =====================================
// 🔹 READ - Toutes les boutiques
// GET /boutiques
// =====================================
router.get("/", async (req, res) => {
  try {
    const boutiques = await Boutique.find({ is_deleted: false });
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// 🔹 READ - Une boutique par ID
// GET /boutiques/:id
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);
    if (!boutique || boutique.is_deleted) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }
    res.json(boutique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// 🔹 UPDATE - Modifier une boutique
// PUT /boutiques/:id
// =====================================
router.put("/:id", async (req, res) => {
  try {
    const updatedBoutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedBoutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }
    res.json(updatedBoutique);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// =====================================
// 🔹 DELETE - Supprimer une boutique (soft delete)
// DELETE /boutiques/:id
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }
    boutique.is_deleted = true;
    await boutique.save();
    res.json({ message: "Boutique supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
