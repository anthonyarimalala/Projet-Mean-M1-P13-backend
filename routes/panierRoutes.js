const express = require("express");
const router = express.Router();
const Panier = require("../models/Panier");
const Produit = require("../models/Produits");
const Boutique = require("../models/Boutique");

// =====================================
// AJOUTER UN PRODUIT UNIQUE
// =====================================
router.post("/add", async (req, res) => {
  try {
    const { user_id, boutique_id, produit_id, quantite = 1 } = req.body;
    if (!user_id || !boutique_id || !produit_id) {
      return res.status(400).json({ message: "Données invalides" });
    }

    let panier = await Panier.findOne({ user_id, is_active: true });
    if (!panier) panier = new Panier({ user_id, boutiques: [] });

    let boutique = panier.boutiques.find(b => b.boutique_id === boutique_id);
    if (!boutique) {
      boutique = { boutique_id, produits: [] };
      panier.boutiques.push(boutique);
    }

    if (!Array.isArray(boutique.produits)) boutique.produits = [];

    let produit = boutique.produits.find(p => p.produit_id === produit_id);
    if (produit) produit.quantite += Number(quantite);
    else boutique.produits.push({ produit_id, quantite: Number(quantite) });

    const savedPanier = await panier.save();
    res.status(201).json(savedPanier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// AJOUTER PLUSIEURS PRODUITS (/add-batch)
// =====================================

    }

    // Indiquer à Mongoose que boutiques a été modifié
    panier.markModified("boutiques");

    // Sauvegarder le panier
    const savedPanier = await panier.save();
    console.log("Panier sauvegardé:", savedPanier);

    res.status(201).json(savedPanier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
*/

 

router.post("/add-batch", async (req, res) => {
  try {

    console.log("========== ADD BATCH ==========");
    console.log("Body reçu :", JSON.stringify(req.body, null, 2));

    const { user_id, boutiques } = req.body;

    if (!user_id || !Array.isArray(boutiques)) {
      console.log("❌ Données invalides");
      return res.status(400).json({ message: "Données invalides" });
    }

    let panier = await Panier.findOne({ user_id, is_active: true });

    if (!panier) {
      console.log("🆕 Création nouveau panier pour :", user_id);
      panier = new Panier({ user_id, boutiques: [] });
    } else {
      console.log("📦 Panier existant trouvé :", panier._id);
    }

    for (const b of boutiques) {

      console.log("---- Traitement boutique :", b.boutique_id);

      let boutique = panier.boutiques.find(x => x.boutique_id === b.boutique_id);

      if (!boutique) {
        console.log("➕ Nouvelle boutique ajoutée :", b.boutique_id);

        boutique = panier.boutiques.create({
          boutique_id: b.boutique_id,
          produits: [],
          total_boutique: 0
        });

        panier.boutiques.push(boutique);
      } else {
        console.log("✔ Boutique déjà présente :", b.boutique_id);
      }

      for (const p of b.produits) {

        console.log("   👉 Produit reçu :", p);

        const produitDB = await Produit.findById(p.produit_id);

        if (!produitDB) {
          console.log("   ❌ Produit introuvable en DB :", p.produit_id);
          continue;
        }

        console.log("   ✔ Produit trouvé en DB :", produitDB._id);

        const prix = produitDB.en_vente
          ? produitDB.prix_promo
          : produitDB.prix_vente;

        console.log("   💰 Prix utilisé :", prix);

        const totalProduit = prix * Number(p.quantite);

        let produit = boutique.produits.find(x => x.produit_id === p.produit_id);

        if (produit) {
          console.log("   🔁 Produit déjà dans panier, mise à jour quantité");

          produit.quantite += Number(p.quantite);
          produit.total_produit = produit.prix_unitaire * produit.quantite;

          console.log("   🔄 Nouvelle quantité :", produit.quantite);
          console.log("   🔄 Nouveau total produit :", produit.total_produit);

        } else {
          console.log("   ➕ Ajout nouveau produit au panier");

          boutique.produits.push({
            produit_id: p.produit_id,
            quantite: Number(p.quantite),
            prix_unitaire: prix,
            total_produit: totalProduit
          });

          console.log("   ✅ Produit ajouté :", {
            produit_id: p.produit_id,
            quantite: Number(p.quantite),
            prix_unitaire: prix,
            total_produit: totalProduit
          });
        }
      }

      console.log("📦 Produits actuels dans boutique :", 
        JSON.stringify(boutique.produits, null, 2)
      );

      // 🔥 Recalcul total boutique
      boutique.total_boutique = boutique.produits.reduce(
        (sum, prod) => sum + prod.total_produit,
        0
      );

      console.log("🧮 Total boutique recalculé :", boutique.total_boutique);
    }

    console.log("💾 Panier avant sauvegarde :");
    console.log(JSON.stringify(panier, null, 2));

    panier.markModified("boutiques");

    const savedPanier = await panier.save();

    console.log("✅ Panier sauvegardé :");
    console.log(JSON.stringify(savedPanier, null, 2));

    console.log("========== FIN ADD BATCH ==========\n");

    res.status(201).json(savedPanier);

  } catch (error) {
    console.error("❌ ERREUR ADD-BATCH :", error);
    res.status(500).json({ message: error.message });
  }
});



// =====================================
// CALCULER LE PANIER
// =====================================
router.post("/calc", async (req, res) => {
  try {
    const { user_id, boutiques } = req.body;
    if (!user_id || !boutiques || !Array.isArray(boutiques)) {
      return res.status(400).json({ message: "Données invalides" });
    }

    // Récupérer tous les ids des produits
    const produitIds = [];
    boutiques.forEach(b => b.produits.forEach(p => produitIds.push(p.produit_id)));

    const produitsDB = await Produit.find({ _id: { $in: produitIds } }).lean();
    const produitsMap = {};
    produitsDB.forEach(p => (produitsMap[p._id] = p));

    let totalGeneral = 0;
    const result = [];

    for (const b of boutiques) {
      const boutiqueData = await Boutique.findById(b.boutique_id).lean();
      if (!boutiqueData) continue;

      let sousTotal = 0;
      const produitsDetail = [];

      for (const p of b.produits) {
        const produitData = produitsMap[p.produit_id];
        if (!produitData) continue;

        const prix = produitData.prix_promo && produitData.prix_promo > 0
          ? produitData.prix_promo
          : produitData.prix_vente;

        const montant = prix * p.quantite;
        sousTotal += montant;

        produitsDetail.push({
          produit_id: produitData._id,
          nom: produitData.nom,
          prix,
          quantite: p.quantite,
          montant,
        });
      }

      totalGeneral += sousTotal;

      result.push({
        boutique_id: boutiqueData._id,
        nom_boutique: boutiqueData.nom_boutique,
        sousTotal,
        produits: produitsDetail,
      });
    }

    res.status(200).json({
      user_id,
      totalGeneral,
      boutiques: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// MODIFIER QUANTITÉ D’UN PRODUIT
// =====================================
router.put("/update", async (req, res) => {
  try {
    const { user_id, boutique_id, produit_id, quantite } = req.body;
    if (!user_id || !boutique_id || !produit_id || quantite < 0) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const panier = await Panier.findOne({ user_id, is_active: true });
    if (!panier) return res.status(404).json({ message: "Panier non trouvé" });

    const boutique = panier.boutiques.find(b => b.boutique_id === boutique_id);
    if (!boutique) return res.status(404).json({ message: "Boutique non trouvée dans le panier" });

    const produit = boutique.produits.find(p => p.produit_id === produit_id);
    if (!produit) return res.status(404).json({ message: "Produit non trouvé dans le panier" });

    if (quantite === 0) {
      boutique.produits = boutique.produits.filter(p => p.produit_id !== produit_id);
    } else {
      produit.quantite = quantite;
    }

    const savedPanier = await panier.save();
    res.status(200).json(savedPanier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// SUPPRIMER UN PRODUIT
// =====================================
router.delete("/remove", async (req, res) => {
  try {
    const { user_id, boutique_id, produit_id } = req.body;
    if (!user_id || !boutique_id || !produit_id) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const panier = await Panier.findOne({ user_id, is_active: true });
    if (!panier) return res.status(404).json({ message: "Panier non trouvé" });

    const boutique = panier.boutiques.find(b => b.boutique_id === boutique_id);
    if (!boutique) return res.status(404).json({ message: "Boutique non trouvée dans le panier" });

    boutique.produits = boutique.produits.filter(p => p.produit_id !== produit_id);

    const savedPanier = await panier.save();
    res.status(200).json(savedPanier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// RÉCUPÉRER LE PANIER D’UN UTILISATEUR
// =====================================
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const panier = await Panier.findOne({ user_id, is_active: true }).lean();
    if (!panier) return res.status(404).json({ message: "Panier vide" });

    res.status(200).json(panier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================
// SUPPRIMER LE PANIER D’UN UTILISATEUR
// =====================================
router.delete("/delete/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // On peut choisir soft-delete ou hard-delete
    // Option 1: soft-delete (désactiver le panier)
    const panier = await Panier.findOne({ user_id, is_active: true });
    if (!panier) return res.status(404).json({ message: "Panier non trouvé" });

    panier.is_active = false;
    await panier.save();

    // Option 2: hard-delete (supprimer complètement)
    // await Panier.deleteOne({ user_id });

    res.status(200).json({ message: "Panier supprimé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;