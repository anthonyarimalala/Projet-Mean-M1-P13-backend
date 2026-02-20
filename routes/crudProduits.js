const express = require("express");
const router = express.Router();
const Produit = require("../models/Produits");

// =====================================
// CREATE
// =====================================
router.post("/", async (req, res) => {
  try {
    const produit = new Produit(req.body);
    const savedProduit = await produit.save();
    res.status(201).json(savedProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// =====================================
// READ ALL (only active)
// =====================================
router.get("/", async (req, res) => {
  try {
    const produits = await Produit.find({ is_active: true });
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// READ BY ID
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit || !produit.is_active) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// UPDATE
// =====================================
router.put("/:id", async (req, res) => {
  try {
    const updatedProduit = await Produit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduit) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    res.json(updatedProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// =====================================
// DELETE (soft delete)
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    produit.is_active = false;
    await produit.save();

    res.json({ message: "Produit supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
