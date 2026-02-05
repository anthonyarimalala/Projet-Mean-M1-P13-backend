const express = require("express");
const router = express.Router();
<<<<<<< Updated upstream
const Boutique = require("../models/Boutique"); 
=======
const Boutique = require("../models/Boutique"); // ton schema Boutique
>>>>>>> Stashed changes

// =====================================
//  CREATE 
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
<<<<<<< Updated upstream
//  READ 
=======
// READ 
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
//  READ BY ID
=======
//  GET BY ID
>>>>>>> Stashed changes
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
//  UPDATE 
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
//  DELETE BY ID
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
