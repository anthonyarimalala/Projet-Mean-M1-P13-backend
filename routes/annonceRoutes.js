const express = require("express");
const router = express.Router();
const annonceService = require("../service/AnnonceService");

const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const annonces = await annonceService.getPubliee(page, limit);
    res.json(annonces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/cibles", async (req, res) => {
  try {
    const { cibles } = req.body;
    const page = parseInt(req.body.page, 10) || 1;
    const limit = parseInt(req.body.limit, 10) || 10;

    const annonces = await annonceService.getByCible(cibles, page, limit);
    res.json(annonces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const annonce = await annonceService.getById(req.params.id);
    if (!annonce) {
      return res.status(404).json({ message: "Annonce introuvable" });
    }
    res.json(annonce);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, roleMiddleware("ADMIN", "BOUTIQUE"), async (req, res) => {
  try {
    const annonce = await annonceService.createAnnonce(req.body);
    res.status(201).json(annonce);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", auth, roleMiddleware("ADMIN", "BOUTIQUE"), async (req, res) => {
  try {
    const annonce = await annonceService.updateAnnonce(req.params.id, req.body);
    if (!annonce) {
      return res.status(404).json({ message: "Annonce introuvable" });
    }
    res.json(annonce);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete(
  "/:id",
  auth,
  roleMiddleware("ADMIN", "BOUTIQUE"),
  async (req, res) => {
    try {
      const annonce = await annonceService.deleteAnnonce(req.params.id);
      if (!annonce) {
        return res.status(404).json({ message: "Annonce introuvable" });
      }
      res.json({ message: "Annonce supprimée" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
