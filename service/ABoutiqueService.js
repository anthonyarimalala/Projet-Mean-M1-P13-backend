const Boutique = require("../models/Boutique");

exports.updateBoutiqueFromDemande = async (
  boutiqueId,
  demandeData,
  locataireId
) => {
  try {
    // Préparer les données de mise à jour
    const updateData = {
      nom_boutique: demandeData.boutique.nom_demande,
      locataire_id: locataireId,
      is_disponible: false, // La boutique n'est plus disponible
    };

    // Mettre à jour les catégories si fournies
    if (demandeData.categories && demandeData.categories.length > 0) {
      updateData.categories = demandeData.categories;
    }

    // Mettre à jour le site web si fourni
    if (demandeData.site_web) {
      updateData.lien_site_web = demandeData.site_web;
    }

    // Mettre à jour la boutique
    const boutique = await Boutique.findByIdAndUpdate(
      boutiqueId,
      { $set: updateData },
      { new: true } // Retourner la boutique mise à jour
    );

    if (!boutique) {
      throw new Error("Boutique introuvable");
    }

    console.log(`✅ Boutique ${boutiqueId} mise à jour avec succès`);
    return boutique;
  } catch (error) {
    console.error(`❌ Erreur mise à jour boutique ${boutiqueId}:`, error);
    throw error;
  }
};
