function versUtilisateur(r) {
  if (!r) return null;
  return {
    id: r.id, nom: r.nom, role: r.role, telephone: r.telephone,
    localite: r.localite, societe: r.societe, email: r.email,
    actif: r.actif, verifie: r.verifie, sel: r.sel, hash: r.hash,
    dateCreation: r.date_creation,
  };
}

function versTransporteur(r) {
  if (!r) return null;
  return {
    id: r.id, nom: r.nom, telephone: r.telephone, vehicule: r.vehicule,
    capaciteKg: r.capacite_kg, zone: r.zone, tarifKg: r.tarif_kg, actif: r.actif,
  };
}

function versOffre(r) {
  if (!r) return null;
  return {
    id: r.id, planteurId: r.planteur_id, produit: r.produit,
    quantite: r.quantite, quantiteRestante: r.quantite_restante, prix: r.prix,
    qualite: r.qualite, localite: r.localite,
    dateDisponibilite: r.date_disponibilite, statut: r.statut,
    dateCreation: r.date_creation,
  };
}

function versCommande(r) {
  if (!r) return null;
  return {
    id: r.id, reference: r.reference, offreId: r.offre_id,
    acheteurId: r.acheteur_id, planteurId: r.planteur_id, produit: r.produit,
    quantite: r.quantite, prixKg: r.prix_kg, montantProduits: r.montant_produits,
    commission: r.commission, fraisTransport: r.frais_transport,
    montantTotal: r.montant_total, statut: r.statut, transporteurId: r.transporteur_id,
    lieuLivraison: r.lieu_livraison, modePaiement: r.mode_paiement,
    transportParEko: r.transport_par_eko,
    dateCreation: r.date_creation, dateAcceptation: r.date_acceptation,
    dateExpedition: r.date_expedition, dateLivraison: r.date_livraison,
    datePaiement: r.date_paiement, historique: r.historique || [],
  };
}

function versJournal(r) {
  if (!r) return null;
  return { id: r.id, date: r.date, acteur: r.acteur, action: r.action, details: r.details };
}

function versParametres(r) {
  if (!r) return null;
  return {
    nomEntreprise: r.nom_entreprise, formeJuridique: r.forme_juridique, rccm: r.rccm,
    siege: r.siege, telephone: r.telephone, email: r.email, devise: r.devise,
    commissionParKg: r.commission_par_kg, commissionMin: r.commission_min,
    commissionMax: r.commission_max, tarifTransportParKg: r.tarif_transport_par_kg,
    objectifMensuelKg: r.objectif_mensuel_kg, objectifRevenuMensuel: r.objectif_revenu_mensuel,
    besoinFinancement: r.besoin_financement,
  };
}

module.exports = {
  versUtilisateur, versTransporteur, versOffre, versCommande, versJournal, versParametres,
};
