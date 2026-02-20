const express = require("express");
const router = express.Router();
const annonceCommentaire = require("../service/AnnonceCommentaireService");

const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * ======================================================
 * ➜ CREATE COMMENTAIRE
 * POST /api/commentaires
 * ======================================================
 */
router.post("/", auth, async (req, res) => {
  try {
    console.log(req.body);
    const commentaire = await annonceCommentaire.createCommentaire({
      ...req.body,
      // auteur: {
      //   user_id: req.user.id,
      //   nom: req.user.nom,
      //   prenom: req.user.prenom,
      // },
    });

    

    res.status(201).json(commentaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
});

/**
 * ======================================================
 * ➜ GET COMMENTAIRES BY ANNONCE
 * GET /api/commentaires/annonce/:annonceId
 * ======================================================
 */
router.get("/annonce/:annonceId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await annonceCommentaire.getCommentairesByAnnonce(
      req.params.annonceId,
      Number(page),
      Number(limit)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ======================================================
 * ➜ GET COMMENTAIRE BY ID
 * GET /api/commentaires/:id
 * ======================================================
 */
router.get("/:id", async (req, res) => {
  try {
    const commentaire = await annonceCommentaire.getCommentaireById(
      req.params.id
    );

    if (!commentaire) {
      return res.status(404).json({ message: "Commentaire introuvable" });
    }

    res.json(commentaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ======================================================
 * ➜ UPDATE COMMENTAIRE
 * PUT /api/commentaires/:id
 * ======================================================
 */
router.put("/:id", auth, async (req, res) => {
  try {
    // console.log(req.body)
    const commentaire = await annonceCommentaire.getCommentaireById(
      req.params.id
    );

    if (!commentaire) {
      return res.status(404).json({ message: "Commentaire introuvable" });
    }

    // Vérifier si c'est l'auteur ou ADMIN
    if (
      commentaire.auteur.user_id !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const updated = await annonceCommentaire.updateCommentaire(req.params.id, {
      contenu: req.body.contenu,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ======================================================
 * ➜ DELETE COMMENTAIRE
 * DELETE /api/commentaires/:id
 * ======================================================
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const commentaire = await annonceCommentaire.getCommentaireById(
      req.params.id
    );

    if (!commentaire) {
      return res.status(404).json({ message: "Commentaire introuvable" });
    }

    // Vérifier si auteur ou ADMIN
    if (
      commentaire.auteur.user_id !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await annonceCommentaire.deleteCommentaire(req.params.id);

    res.json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
