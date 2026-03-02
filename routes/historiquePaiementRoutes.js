const express = require("express");
const router = express.Router();
const paiementService = require("../service/HistoriquePaiementService");

/**
 * Créer un nouveau paiement
 */
router.post("/", async (req, res) => {
  try {
    const paiement = await paiementService.createPaiement(req.body);
    res.status(201).json(paiement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET tous les paiements avec pagination et filtre optionnel
 * Ex: /paiements?page=1&limit=10&locataire_id=USR_001
 */
router.get("/", async (req, res) => {
  try {
    const { page, limit, locataire_id, boutique_id } = req.query;
    const filter = {};
    if (locataire_id) filter.locataire_id = locataire_id;
    if (boutique_id) filter.boutique_id = boutique_id;

    const result = await paiementService.getPaiements({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filter,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET paiement par ID
 */
router.get("/:id", async (req, res) => {
  try {
    const paiement = await paiementService.getPaiementById(req.params.id);
    if (!paiement) return res.status(404).json({ message: "Non trouvé" });
    res.json(paiement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET paiements d'une boutique avec show_to_user=true
 * et pagination
 * Ex: /paiements/boutique/BOUT_108?page=1&limit=10
 */
router.get("/boutique/:boutiqueId", async (req, res) => {
  try {
    const { boutiqueId } = req.params;
    const { page, limit } = req.query;

    const result = await paiementService.getPaiementsByBoutique(
      boutiqueId,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE paiement par ID
 */
router.put("/:id", async (req, res) => {
  try {
    const paiement = await paiementService.updatePaiement(
      req.params.id,
      req.body
    );
    if (!paiement) return res.status(404).json({ message: "Non trouvé" });
    res.json(paiement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE paiement par ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const paiement = await paiementService.deletePaiement(req.params.id);
    if (!paiement) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Paiement supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;