const express = require("express");
const router = express.Router();
const boutiqueAvisService = require("../service/BoutiqueAvisService");

const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Routes publiques
// Récupérer les avis d'une boutique avec pagination
router.get("/boutique/:id_boutique", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const avis = await boutiqueAvisService.getByBoutique(
      req.params.id_boutique,
      page,
      limit
    );
    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les statistiques d'une boutique
router.get("/stats/:id_boutique", async (req, res) => {
  try {
    const stats = await boutiqueAvisService.getStatsBoutique(req.params.id_boutique);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer la moyenne des notes d'une boutique
router.get("/moyenne/:id_boutique", async (req, res) => {
  try {
    const moyenne = await boutiqueAvisService.getMoyenneNote(req.params.id_boutique);
    res.json(moyenne);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer un avis spécifique par son ID
router.get("/:id", async (req, res) => {
  try {
    const avis = await boutiqueAvisService.getById(req.params.id);
    if (!avis) {
      return res.status(404).json({ message: "Avis introuvable" });
    }
    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Routes protégées (nécessitent authentification)
// Créer ou mettre à jour un avis (un utilisateur ne peut avoir qu'un avis par boutique)
router.post("/", auth, async (req, res) => {
  try {
    const { id_boutique, avis, note } = req.body;
    const id_user = req.user.id; // À adapter selon votre structure d'utilisateur

    // Validation des données
    if (!id_boutique || !avis || !note) {
      return res.status(400).json({ 
        message: "Tous les champs sont requis : id_boutique, avis, note" 
      });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({ 
        message: "La note doit être comprise entre 1 et 5" 
      });
    }

    const result = await boutiqueAvisService.createOrUpdateAvis({
      id_boutique,
      id_user,
      avis,
      note
    });

    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Récupérer tous les avis d'un utilisateur (nécessite authentification)
router.get("/user/mes-avis", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const id_user = req.user.id;

    const avis = await boutiqueAvisService.getByUser(id_user, page, limit);
    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vérifier si l'utilisateur a déjà donné un avis pour une boutique
router.get("/check/:id_boutique", auth, async (req, res) => {
  try {
    const id_user = req.user.id;
    const avis = await boutiqueAvisService.checkUserAvis(
      req.params.id_boutique,
      id_user
    );

    res.json({
      hasAvis: !!avis,
      avis: avis || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un avis spécifique (seul l'auteur ou admin peut modifier)
router.put("/:id", auth, async (req, res) => {
  try {
    const { avis, note } = req.body;
    const id_user = req.user.id;
    const userRole = req.user.role; // À adapter selon votre structure

    // Vérifier que l'avis existe et appartient à l'utilisateur
    const existingAvis = await boutiqueAvisService.getById(req.params.id);
    
    if (!existingAvis) {
      return res.status(404).json({ message: "Avis introuvable" });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (existingAvis.id_user.toString() !== id_user && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à modifier cet avis" 
      });
    }

    // Validation des données
    if (note && (note < 1 || note > 5)) {
      return res.status(400).json({ 
        message: "La note doit être comprise entre 1 et 5" 
      });
    }

    const updatedAvis = await boutiqueAvisService.updateAvis(req.params.id, {
      avis,
      note
    });

    res.json(updatedAvis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Supprimer un avis (seul l'auteur ou admin peut supprimer)
router.delete("/:id", auth, async (req, res) => {
  try {
    const id_user = req.user.id;
    const userRole = req.user.role;

    // Vérifier que l'avis existe
    const existingAvis = await boutiqueAvisService.getById(req.params.id);
    
    if (!existingAvis) {
      return res.status(404).json({ message: "Avis introuvable" });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (existingAvis.id_user.toString() !== id_user && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à supprimer cet avis" 
      });
    }

    await boutiqueAvisService.deleteAvis(req.params.id);
    
    // Recalculer les stats après suppression
    const stats = await boutiqueAvisService.getStatsBoutique(existingAvis.id_boutique);

    res.json({ 
      message: "Avis supprimé avec succès",
      stats 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Routes admin uniquement
// Supprimer tous les avis d'une boutique (admin seulement)
router.delete(
  "/boutique/:id_boutique/all",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const result = await boutiqueAvisService.deleteAvisByBoutique(
        req.params.id_boutique
      );
      
      res.json({ 
        message: `${result.deletedCount} avis supprimés avec succès`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Filtrer les avis par note (admin seulement)
router.get(
  "/note/:note",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const note = parseInt(req.params.note, 10);
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      if (note < 1 || note > 5) {
        return res.status(400).json({ 
          message: "La note doit être comprise entre 1 et 5" 
        });
      }

      const avis = await boutiqueAvisService.getByNote(note, page, limit);
      res.json(avis);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Filtrer les avis par période (admin seulement)
router.get(
  "/periode/:dateDebut/:dateFin",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const { dateDebut, dateFin } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const avis = await boutiqueAvisService.getByPeriode(
        dateDebut,
        dateFin,
        page,
        limit
      );
      res.json(avis);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;