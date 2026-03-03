const express = require("express");
const router = express.Router();
const demandeService = require("../service/DemandeLocationService");


/**
 * GET / - Récupérer toutes les demandes
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const statut = req.query.statut || null;

    const demandes = await demandeService.getAllDemandes(page, limit, statut);
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /en-attente - Récupérer les demandes en attente
 */
router.get("/en-attente", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const demandes = await demandeService.getDemandesEnAttente(page, limit);
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /stats - Statistiques des demandes
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await demandeService.getDemandesStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /utilisateur/:userId - Récupérer les demandes d'un utilisateur
 */
router.get("/utilisateur/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { userId } = req.params;

    const demandes = await demandeService.getDemandesByDemandeur(userId, page, limit);
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /boutique/:boutiqueId - Récupérer les demandes d'une boutique
 */
router.get("/boutique/:boutiqueId", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { boutiqueId } = req.params;

    const demandes = await demandeService.getDemandesByBoutique(boutiqueId, page, limit);
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /:id - Récupérer une demande par son ID
 */
router.get("/:id", async (req, res) => {
  try {
    const demande = await demandeService.getDemandeById(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST / - Créer une nouvelle demande de location
 * Accepte la structure avec "demandeur" contenant "user_id" et "nom"
 * PLUS DE VÉRIFICATION - Plusieurs demandes autorisées pour une même boutique
 */
router.post("/", async (req, res) => {
  try {
    const { 
      boutiqueId, 
      nomBoutique, 
      categories, 
      siteWeb, 
      message,
      demandeur
    } = req.body;
    
    // Vérifier que les informations du demandeur sont fournies
    if (!demandeur || !demandeur.user_id) {
      return res.status(400).json({ 
        message: "Les informations du demandeur (user_id) sont requises" 
      });
    }

    // ✅ VÉRIFICATION SUPPRIMÉE - Plus de blocage pour plusieurs demandes
    // const existingDemande = await demandeService.checkExistingDemandeEnAttente(
    //   boutiqueId,
    //   demandeur.user_id
    // );
    //
    // if (existingDemande) {
    //   return res.status(400).json({ 
    //     message: "Une demande en attente existe déjà pour cette boutique" 
    //   });
    // }

    // Pour l'exemple, on met un numéro par défaut
    const shopNumero = "À déterminer";

    const demandeData = {
      boutique: {
        boutique_id: boutiqueId,
        numero: shopNumero,
        nom_demande: nomBoutique,
      },
      categories: Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim()),
      site_web: siteWeb || null,
      message: message || null,
      demandeur: {
        user_id: demandeur.user_id,
        nom: demandeur.nom,
      },
      statut: "EN_ATTENTE",
      date_demande: new Date(),
    };

    const demande = await demandeService.createDemande(demandeData);
    res.status(201).json(demande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /:id/statut - Mettre à jour le statut d'une demande
 */
router.put("/:id/statut", async (req, res) => {
  try {
    const { statut, notes, adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ 
        message: "L'ID de l'administrateur (adminId) est requis" 
      });
    }

    if (!["APPROUVEE", "REJETEE"].includes(statut)) {
      return res.status(400).json({ 
        message: "Statut invalide. Utilisez APPROUVEE ou REJETEE" 
      });
    }

    const demande = await demandeService.updateDemandeStatut(
      req.params.id,
      statut,
      adminId,
      notes
    );

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    res.json(demande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /:id/annuler - Annuler une demande
 */
router.put("/:id/annuler", async (req, res) => {
  try {
    const { userId } = req.body;
    const demande = await demandeService.getDemandeById(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Vérifier que c'est bien le demandeur qui annule
    if (demande.demandeur.user_id.toString() !== userId) {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à annuler cette demande" 
      });
    }

    if (demande.statut !== "EN_ATTENTE") {
      return res.status(400).json({ 
        message: "Seules les demandes en attente peuvent être annulées" 
      });
    }

    demande.statut = "ANNULEE";
    await demande.save();

    res.json({ message: "Demande annulée avec succès", demande });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /:id - Mettre à jour une demande
 */
router.put("/:id", async (req, res) => {
  try {
    const { userId, nomBoutique, categories, siteWeb, message } = req.body;
    const demande = await demandeService.getDemandeById(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Vérifier que c'est bien le demandeur qui modifie
    if (demande.demandeur.user_id.toString() !== userId) {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à modifier cette demande" 
      });
    }

    if (demande.statut !== "EN_ATTENTE") {
      return res.status(400).json({ 
        message: "Seules les demandes en attente peuvent être modifiées" 
      });
    }

    // Mettre à jour uniquement les champs modifiables
    const updateData = {};
    if (nomBoutique) updateData["boutique.nom_demande"] = nomBoutique;
    if (categories) updateData.categories = Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim());
    if (siteWeb !== undefined) updateData.site_web = siteWeb;
    if (message !== undefined) updateData.message = message;

    const demandeMaj = await demandeService.updateDemande(req.params.id, updateData);
    res.json(demandeMaj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /:id - Supprimer une demande
 */
router.delete("/:id", async (req, res) => {
  try {
    const demande = await demandeService.deleteDemande(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }
    
    res.json({ message: "Demande supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;