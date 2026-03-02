const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

// Ajouter ou mettre à jour le stock pour un produit
router.post('/add', async (req, res) => {
  try {
    const { produit_id, quantite } = req.body;
    if (!produit_id || quantite == null) {
      return res.status(400).json({ message: 'Produit et quantité requis' });
    }

    // Vérifie si le stock existe déjà pour ce produit
    let stock = await Stock.findOne({ produit_id });
    if (stock) {
      stock.quantite += quantite;
      stock.updated_at = Date.now();
    } else {
      stock = new Stock({ produit_id, quantite });
    }

    const savedStock = await stock.save();
    res.status(200).json(savedStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer le stock d’un produit
router.get('/:produit_id', async (req, res) => {
  try {
    const stock = await Stock.findOne({ produit_id: req.params.produit_id });

    // ✅ Si aucun stock trouvé → renvoyer 0
    if (!stock) {
      return res.json({
        produit_id: req.params.produit_id,
        quantite: 0
      });
    }

    // ✅ Si trouvé → renvoyer le stock normal
    res.json(stock);

  } catch (error) {

    console.error('Erreur récupération stock :', error);

    // ✅ En cas d’erreur serveur → renvoyer 0 aussi
    res.json({
      produit_id: req.params.produit_id,
      quantite: 0
    });
  }
});

// Récupérer tous les stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find().populate('produit_id', 'nom');
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// récupérer le stock d’un produit
router.delete('/:produit_id', async (req, res) => {
  try {
    const deleted = await Stock.findOneAndDelete({ produit_id: req.params.produit_id });
    if (!deleted) return res.status(404).json({ message: 'Stock non trouvé' });
    res.json({ message: 'Stock supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;