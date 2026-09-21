const { creerMotDePasse } = require("../lib/motdepasse");

function ilYaJours(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

const UTILISATEURS = [
  { nom: "Administrateur Eko", role: "admin", telephone: "0700000000", motDePasse: "admin123", localite: "Abidjan", email: "contact@ekocorporate.ci", anciennete: 200 },
  { nom: "Kouassi Yao", role: "planteur", telephone: "0701010101", motDePasse: "demo1234", localite: "Divo", anciennete: 150 },
  { nom: "Aya Brou", role: "planteur", telephone: "0702020202", motDePasse: "demo1234", localite: "Agboville", anciennete: 110 },
  { nom: "Sekou Traoré", role: "planteur", telephone: "0703030303", motDePasse: "demo1234", localite: "Korhogo", anciennete: 95 },
  { nom: "Marc Koffi", role: "planteur", telephone: "0704040404", motDePasse: "demo1234", localite: "Tiassalé", anciennete: 60, verifie: false },
  { nom: "Usine SITA Agro", role: "acheteur", telephone: "0705050505", motDePasse: "demo1234", localite: "Yopougon", societe: "SITA Agro SARL", anciennete: 140 },
  { nom: "Grossiste Adjamé Market", role: "acheteur", telephone: "0706060606", motDePasse: "demo1234", localite: "Adjamé", societe: "Adjamé Market", anciennete: 100 },
  { nom: "Coopérative Bouaké Vivrier", role: "acheteur", telephone: "0707070707", motDePasse: "demo1234", localite: "Bouaké", societe: "CBV Coop", anciennete: 70 },
];

const TRANSPORTEURS = [
  { nom: "Transport Ivoire Express", telephone: "0708080808", vehicule: "Camion 10T", capaciteKg: 10000, zone: "Abidjan – Sud", tarifKg: 22, actif: true },
  { nom: "Bamba Logistique", telephone: "0709090909", vehicule: "Camion 5T", capaciteKg: 5000, zone: "Centre – Bouaké", tarifKg: 26, actif: true },
  { nom: "Nord Cargo", telephone: "0710101010", vehicule: "Camion 20T", capaciteKg: 20000, zone: "Nord – Korhogo", tarifKg: 30, actif: true },
  { nom: "Kouadio Transit", telephone: "0711111111", vehicule: "Fourgon 3T", capaciteKg: 3000, zone: "Périurbain Abidjan", tarifKg: 18, actif: false },
];

// [produit, quantite, prix, localite, rangPlanteur (1-indexé parmi les planteurs), jours]
const GRILLE_OFFRES = [
  ["Cacao", 20000, 900, "Divo", 1, 12],
  ["Anacarde", 26000, 450, "Korhogo", 3, 20],
  ["Igname", 14000, 300, "Agboville", 2, 8],
  ["Banane plantain", 9000, 260, "Agboville", 2, 5],
  ["Manioc", 18000, 180, "Tiassalé", 4, 15],
  ["Maïs", 16000, 220, "Korhogo", 3, 25],
  ["Café", 8000, 850, "Divo", 1, 30],
  ["Tomate", 6000, 400, "Tiassalé", 4, 3],
];

// [rangOffre (1-indexé), rangAcheteur (1-indexé parmi les acheteurs), quantite, jours, statut, rangTransporteur ou null]
const SCENARIO = [
  [1, 1, 3000, 170, "payee", 1], [2, 2, 5000, 160, "payee", 3],
  [3, 3, 2500, 150, "payee", 2], [5, 1, 4000, 140, "payee", 1],
  [6, 2, 3500, 130, "payee", 2], [1, 3, 2000, 120, "payee", 1],
  [2, 1, 4500, 110, "payee", 3], [4, 2, 1800, 95, "payee", 1],
  [7, 1, 1200, 80, "payee", 1], [3, 3, 2200, 70, "payee", 2],
  [5, 2, 3000, 55, "payee", 2], [6, 1, 2800, 40, "payee", 3],
  [2, 3, 3200, 25, "payee", 3], [1, 1, 2500, 14, "livree", 1],
  [8, 2, 900, 9, "en_transport", 4], [3, 3, 1500, 5, "acceptee", null],
  [4, 1, 1000, 2, "en_attente", null], [6, 2, 2000, 1, "en_attente", null],
];

async function assurerDonneesInitiales(pool) {
  const { rows } = await pool.query("select count(*)::int as n from utilisateurs");
  if (rows[0].n > 0) return;

  const client = await pool.connect();
  try {
    await client.query("begin");

    const idsUtilisateurs = [];
    for (const u of UTILISATEURS) {
      const mp = creerMotDePasse(u.motDePasse);
      const { rows } = await client.query(
        `insert into utilisateurs (nom, role, telephone, localite, societe, email, actif, verifie, sel, hash, date_creation)
         values ($1,$2,$3,$4,$5,$6,true,$7,$8,$9,$10) returning id`,
        [u.nom, u.role, u.telephone, u.localite || "", u.societe || "", u.email || "",
          u.verifie !== false, mp.sel, mp.hash, ilYaJours(u.anciennete || 120)]
      );
      idsUtilisateurs.push(rows[0].id);
    }
    const planteurIds = idsUtilisateurs.filter((_, i) => UTILISATEURS[i].role === "planteur");
    const acheteurIds = idsUtilisateurs.filter((_, i) => UTILISATEURS[i].role === "acheteur");

    const idsTransporteurs = [];
    for (const t of TRANSPORTEURS) {
      const { rows } = await client.query(
        `insert into transporteurs (nom, telephone, vehicule, capacite_kg, zone, tarif_kg, actif)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [t.nom, t.telephone, t.vehicule, t.capaciteKg, t.zone, t.tarifKg, t.actif]
      );
      idsTransporteurs.push(rows[0].id);
    }

    const idsOffres = [];
    for (const [produit, quantite, prix, localite, rangPlanteur, jours] of GRILLE_OFFRES) {
      const planteurId = planteurIds[(rangPlanteur - 1) % planteurIds.length];
      const { rows } = await client.query(
        `insert into offres (planteur_id, produit, quantite, quantite_restante, prix, qualite, localite, date_disponibilite, statut, date_creation)
         values ($1,$2,$3,$3,$4,'Standard marché',$5,$6,'disponible',$7) returning id`,
        [planteurId, produit, quantite, prix, localite, ilYaJours(jours - 5), ilYaJours(jours)]
      );
      idsOffres.push(rows[0].id);
    }

    const parametres = await client.query("select * from parametres where id = 1");
    const commissionParKg = parametres.rows[0].commission_par_kg;
    const tarifTransportParKg = parametres.rows[0].tarif_transport_par_kg;

    let numeroCommande = 1;
    for (const [rangOffre, rangAcheteur, quantite, jours, statut, rangTransporteur] of SCENARIO) {
      const offreId = idsOffres[rangOffre - 1];
      const offre = await client.query("select * from offres where id = $1", [offreId]);
      const o = offre.rows[0];
      const acheteurId = acheteurIds[(rangAcheteur - 1) % acheteurIds.length];
      const transporteurId = rangTransporteur ? idsTransporteurs[rangTransporteur - 1] : null;

      const montantProduits = quantite * o.prix;
      const commission = quantite * commissionParKg;
      const fraisTransport = quantite * tarifTransportParKg;
      const reference = "CMD-" + String(numeroCommande).padStart(4, "0");
      const dateCreation = ilYaJours(jours);
      const dateAcceptation = statut === "en_attente" ? null : ilYaJours(jours - 1);
      const dateExpedition = ["en_transport", "livree", "payee"].includes(statut) ? ilYaJours(jours - 2) : null;
      const dateLivraison = ["livree", "payee"].includes(statut) ? ilYaJours(jours - 3) : null;
      const datePaiement = statut === "payee" ? ilYaJours(jours - 4) : null;
      const historique = JSON.stringify([{ date: dateCreation, statut: "en_attente", par: "Système (démo)" }]);

      await client.query(
        `insert into commandes (reference, offre_id, acheteur_id, planteur_id, produit, quantite, prix_kg,
           montant_produits, commission, frais_transport, montant_total, statut, transporteur_id,
           lieu_livraison, mode_paiement, transport_par_eko, date_creation, date_acceptation,
           date_expedition, date_livraison, date_paiement, historique)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Abidjan','mobile_money',true,$14,$15,$16,$17,$18,$19)`,
        [reference, offreId, acheteurId, o.planteur_id, o.produit, quantite, o.prix,
          montantProduits, commission, fraisTransport, montantProduits + fraisTransport, statut, transporteurId,
          dateCreation, dateAcceptation, dateExpedition, dateLivraison, datePaiement, historique]
      );
      numeroCommande++;

      const nouvelleRestante = Math.max(0, o.quantite_restante - quantite);
      await client.query(
        `update offres set quantite_restante = $1, statut = case when $1 = 0 then 'epuisee' else statut end where id = $2`,
        [nouvelleRestante, offreId]
      );
    }

    await client.query(
      `insert into journal (date, acteur, action, details) values (now(), 'Système', 'initialisation', 'Jeu de démonstration créé')`
    );

    await client.query("commit");
    console.log("  Jeu de données de démonstration inséré dans Supabase/PostgreSQL.");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { assurerDonneesInitiales };
