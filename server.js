/**
 * Eko Corporate — serveur unique (Node.js + PostgreSQL/Supabase)
 * API REST + service des fichiers statiques.
 *   node server.js   →   http://localhost:4000
 *
 * Rôles : admin | planteur | acheteur
 * Données persistées dans PostgreSQL (Supabase). Voir db/schema.sql pour le schéma
 * et .env.example pour la variable DATABASE_URL à renseigner.
 */

require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const pool = require("./db/pool");
const M = require("./db/mappers");
const { creerMotDePasse, verifierMotDePasse } = require("./lib/motdepasse");
const { assurerDonneesInitiales } = require("./db/seed");

const PORT = process.env.PORT || 4000;
const RACINE = __dirname;

const PRODUITS = [
  "Cacao", "Café", "Anacarde", "Hévéa", "Igname", "Manioc",
  "Banane plantain", "Maïs", "Riz paddy", "Tomate", "Piment", "Attiéké",
];

/* ------------------------------------------------------------------ */
/*  Utilitaires HTTP                                                   */
/* ------------------------------------------------------------------ */

function envoyer(res, statut, charge) {
  const corps = JSON.stringify(charge);
  res.writeHead(statut, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(corps);
}

function lireCorps(req) {
  return new Promise((resolve, reject) => {
    let brut = "";
    req.on("data", (c) => {
      brut += c;
      if (brut.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!brut) return resolve({});
      try { resolve(JSON.parse(brut)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function publicUtilisateur(u) {
  if (!u) return null;
  const { sel, hash, ...reste } = u;
  return reste;
}

async function utilisateurDeLaRequete(req) {
  const entete = req.headers["authorization"] || "";
  const token = entete.startsWith("Bearer ") ? entete.slice(7) : null;
  if (!token) return null;
  const { rows } = await pool.query(
    `select u.* from sessions s join utilisateurs u on u.id = s.utilisateur_id
     where s.token = $1 and u.actif = true`,
    [token]
  );
  if (!rows[0]) return null;
  return { ...M.versUtilisateur(rows[0]), token };
}

async function journaliser(acteur, action, details) {
  await pool.query(
    `insert into journal (date, acteur, action, details) values (now(), $1, $2, $3)`,
    [acteur, action, details]
  );
  await pool.query(
    `delete from journal where id not in (select id from journal order by id desc limit 400)`
  );
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
};

function servirStatique(req, res, cheminUrl) {
  const relatif = cheminUrl === "/" ? "/index.html" : decodeURIComponent(cheminUrl);
  const autorise = relatif === "/index.html" || relatif.startsWith("/assets/") || relatif.startsWith("/app/");
  if (!autorise) {
    res.writeHead(403); return res.end("Accès interdit");
  }
  const fichier = path.join(RACINE, relatif);
  if (!fichier.startsWith(RACINE)) {
    res.writeHead(403); return res.end("Accès interdit");
  }
  fs.readFile(fichier, (err, contenu) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Fichier non trouvé");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fichier)] || "application/octet-stream" });
    res.end(contenu);
  });
}

/* ------------------------------------------------------------------ */
/*  Requêtes enrichies (jointures)                                     */
/* ------------------------------------------------------------------ */

async function offresEnrichies(conditions = "", params = []) {
  const { rows } = await pool.query(
    `select o.*, u.nom as planteur_nom, u.localite as planteur_localite, u.verifie as planteur_verifie
     from offres o join utilisateurs u on u.id = o.planteur_id
     ${conditions}
     order by o.date_creation desc`,
    params
  );
  return rows.map((r) => ({
    ...M.versOffre(r),
    planteurNom: r.planteur_nom,
    planteurLocalite: r.planteur_localite,
    planteurVerifie: r.planteur_verifie,
  }));
}

async function commandesEnrichies(conditions = "", params = []) {
  const { rows } = await pool.query(
    `select c.*,
       up.nom as planteur_nom, up.telephone as planteur_tel,
       ua.nom as acheteur_nom, ua.societe as acheteur_societe, ua.telephone as acheteur_tel,
       t.nom as transporteur_nom
     from commandes c
     join utilisateurs up on up.id = c.planteur_id
     join utilisateurs ua on ua.id = c.acheteur_id
     left join transporteurs t on t.id = c.transporteur_id
     ${conditions}
     order by c.date_creation desc`,
    params
  );
  return rows.map((r) => {
    const c = M.versCommande(r);
    return {
      ...c,
      planteurNom: r.planteur_nom || "—",
      planteurTel: r.planteur_tel || "",
      acheteurNom: r.acheteur_societe || r.acheteur_nom || "—",
      acheteurTel: r.acheteur_tel || "",
      transporteurNom: r.transporteur_nom || null,
      netPlanteur: c.montantProduits - c.commission,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Statistiques                                                       */
/* ------------------------------------------------------------------ */

function moisCle(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

async function statistiques(parametres) {
  const p = parametres;
  const { rows: commandesRows } = await pool.query("select * from commandes");
  const commandes = commandesRows.map(M.versCommande);
  const { rows: utilisateursRows } = await pool.query("select * from utilisateurs");
  const utilisateurs = utilisateursRows.map(M.versUtilisateur);
  const { rows: offresRows } = await pool.query("select * from offres");
  const offres = offresRows.map(M.versOffre);
  const { rows: transporteursRows } = await pool.query("select * from transporteurs");
  const transporteurs = transporteursRows.map(M.versTransporteur);

  const realisees = commandes.filter((c) => ["livree", "payee"].includes(c.statut));
  const payees = commandes.filter((c) => c.statut === "payee");
  const maintenant = new Date();
  const moisCourant = moisCle(maintenant.toISOString());

  const duMois = realisees.filter((c) => moisCle(c.dateLivraison || c.dateCreation) === moisCourant);
  const volumeMois = duMois.reduce((s, c) => s + c.quantite, 0);
  const commissionMois = duMois.reduce((s, c) => s + c.commission, 0);
  const transportMois = duMois.reduce((s, c) => s + c.fraisTransport, 0);

  const serie = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const cle = moisCle(d.toISOString());
    const lot = realisees.filter((c) => moisCle(c.dateLivraison || c.dateCreation) === cle);
    serie.push({
      mois: cle,
      libelle: d.toLocaleDateString("fr-FR", { month: "short" }),
      volumeKg: lot.reduce((s, c) => s + c.quantite, 0),
      commission: lot.reduce((s, c) => s + c.commission, 0),
      transport: lot.reduce((s, c) => s + c.fraisTransport, 0),
      transactions: lot.length,
    });
  }

  const parProduit = {};
  realisees.forEach((c) => {
    parProduit[c.produit] = parProduit[c.produit] || { produit: c.produit, volumeKg: 0, revenu: 0, transactions: 0 };
    parProduit[c.produit].volumeKg += c.quantite;
    parProduit[c.produit].revenu += c.commission + c.fraisTransport;
    parProduit[c.produit].transactions += 1;
  });

  const parPlanteur = {};
  realisees.forEach((c) => {
    const u = utilisateurs.find((x) => x.id === c.planteurId);
    const nom = u ? u.nom : "—";
    parPlanteur[nom] = parPlanteur[nom] || { nom, volumeKg: 0, chiffre: 0, transactions: 0 };
    parPlanteur[nom].volumeKg += c.quantite;
    parPlanteur[nom].chiffre += c.montantProduits;
    parPlanteur[nom].transactions += 1;
  });

  const parStatut = {};
  commandes.forEach((c) => { parStatut[c.statut] = (parStatut[c.statut] || 0) + 1; });

  const enAttentePaiement = commandes.filter((c) => c.statut === "livree")
    .reduce((s, c) => s + c.montantTotal, 0);

  return {
    kpi: {
      volumeMoisKg: volumeMois,
      objectifMensuelKg: p.objectifMensuelKg,
      tauxObjectif: p.objectifMensuelKg ? Math.round((volumeMois / p.objectifMensuelKg) * 100) : 0,
      commissionMois, transportMois,
      revenuMois: commissionMois + transportMois,
      objectifRevenuMensuel: p.objectifRevenuMensuel,
      volumeTotalKg: realisees.reduce((s, c) => s + c.quantite, 0),
      revenuTotal: realisees.reduce((s, c) => s + c.commission + c.fraisTransport, 0),
      volumeAffaires: realisees.reduce((s, c) => s + c.montantTotal, 0),
      transactionsTotal: realisees.length,
      transactionsPayees: payees.length,
      panierMoyen: realisees.length ? Math.round(realisees.reduce((s, c) => s + c.montantTotal, 0) / realisees.length) : 0,
      commissionMoyenneKg: realisees.length ? Math.round(realisees.reduce((s, c) => s + c.commission, 0) / realisees.reduce((s, c) => s + c.quantite, 0)) : 0,
      planteurs: utilisateurs.filter((u) => u.role === "planteur").length,
      planteursAValider: utilisateurs.filter((u) => u.role === "planteur" && !u.verifie).length,
      acheteurs: utilisateurs.filter((u) => u.role === "acheteur").length,
      transporteurs: transporteurs.filter((t) => t.actif).length,
      offresActives: offres.filter((o) => o.statut === "disponible").length,
      stockDisponibleKg: offres.filter((o) => o.statut === "disponible").reduce((s, o) => s + o.quantiteRestante, 0),
      commandesAtraiter: commandes.filter((c) => ["en_attente", "acceptee"].includes(c.statut)).length,
      enAttentePaiement,
    },
    serie,
    parProduit: Object.values(parProduit).sort((a, b) => b.volumeKg - a.volumeKg),
    parPlanteur: Object.values(parPlanteur).sort((a, b) => b.volumeKg - a.volumeKg).slice(0, 8),
    parStatut,
  };
}

async function statistiquesUtilisateur(u) {
  const { rows: commandesRows } = await pool.query(
    "select * from commandes where planteur_id = $1 or acheteur_id = $1",
    [u.id]
  );
  const mesCommandes = commandesRows.map(M.versCommande).filter((c) =>
    u.role === "planteur" ? c.planteurId === u.id : c.acheteurId === u.id
  );
  const realisees = mesCommandes.filter((c) => ["livree", "payee"].includes(c.statut));
  const serie = [];
  const maintenant = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const cle = moisCle(d.toISOString());
    const lot = realisees.filter((c) => moisCle(c.dateLivraison || c.dateCreation) === cle);
    serie.push({
      mois: cle,
      libelle: d.toLocaleDateString("fr-FR", { month: "short" }),
      volumeKg: lot.reduce((s, c) => s + c.quantite, 0),
      montant: lot.reduce((s, c) => s + (u.role === "planteur" ? c.montantProduits - c.commission : c.montantTotal), 0),
      transactions: lot.length,
    });
  }
  const parProduit = {};
  realisees.forEach((c) => {
    parProduit[c.produit] = parProduit[c.produit] || { produit: c.produit, volumeKg: 0, revenu: 0, transactions: 0 };
    parProduit[c.produit].volumeKg += c.quantite;
    parProduit[c.produit].revenu += u.role === "planteur" ? c.montantProduits - c.commission : c.montantTotal;
    parProduit[c.produit].transactions += 1;
  });

  if (u.role === "planteur") {
    const { rows: offresRows } = await pool.query("select * from offres where planteur_id = $1", [u.id]);
    const mesOffres = offresRows.map(M.versOffre);
    return {
      role: "planteur", serie, parProduit: Object.values(parProduit).sort((a, b) => b.volumeKg - a.volumeKg),
      kpi: {
        offresActives: mesOffres.filter((o) => o.statut === "disponible").length,
        stockKg: mesOffres.filter((o) => o.statut === "disponible").reduce((s, o) => s + o.quantiteRestante, 0),
        volumeVenduKg: realisees.reduce((s, c) => s + c.quantite, 0),
        revenuNet: realisees.reduce((s, c) => s + c.montantProduits - c.commission, 0),
        commissionVersee: realisees.reduce((s, c) => s + c.commission, 0),
        enAttente: mesCommandes.filter((c) => c.statut === "en_attente").length,
        encours: mesCommandes.filter((c) => ["acceptee", "en_transport"].includes(c.statut)).length,
        aEncaisser: mesCommandes.filter((c) => c.statut === "livree").reduce((s, c) => s + c.montantProduits - c.commission, 0),
        prixMoyenKg: realisees.length ? Math.round(realisees.reduce((s, c) => s + c.montantProduits, 0) / realisees.reduce((s, c) => s + c.quantite, 0)) : 0,
      },
    };
  }
  const { rows: offresDispoRows } = await pool.query("select count(*)::int as n from offres where statut = 'disponible'");
  return {
    role: "acheteur", serie, parProduit: Object.values(parProduit).sort((a, b) => b.volumeKg - a.volumeKg),
    kpi: {
      commandesTotal: mesCommandes.length,
      enCours: mesCommandes.filter((c) => ["en_attente", "acceptee", "en_transport"].includes(c.statut)).length,
      volumeAchateKg: realisees.reduce((s, c) => s + c.quantite, 0),
      montantAchats: realisees.reduce((s, c) => s + c.montantTotal, 0),
      fraisTransport: realisees.reduce((s, c) => s + c.fraisTransport, 0),
      aRegler: mesCommandes.filter((c) => c.statut === "livree").reduce((s, c) => s + c.montantTotal, 0),
      offresDisponibles: offresDispoRows[0].n,
      coutMoyenKg: realisees.length ? Math.round(realisees.reduce((s, c) => s + c.montantTotal, 0) / realisees.reduce((s, c) => s + c.quantite, 0)) : 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Routage API                                                        */
/* ------------------------------------------------------------------ */

const TRANSITIONS = {
  en_attente: ["acceptee", "refusee", "annulee"],
  acceptee: ["en_transport", "annulee"],
  en_transport: ["livree"],
  livree: ["payee"],
  payee: [],
  refusee: [],
  annulee: [],
};

async function api(req, res, url) {
  const chemin = url.pathname.replace(/^\/api/, "");
  const methode = req.method;
  const moi = await utilisateurDeLaRequete(req);
  const corps = ["POST", "PUT", "PATCH"].includes(methode) ? await lireCorps(req).catch(() => null) : {};
  if (corps === null) return envoyer(res, 400, { erreur: "Corps de requête invalide" });

  const exige = (roles) => {
    if (!moi) { envoyer(res, 401, { erreur: "Authentification requise" }); return false; }
    if (roles && !roles.includes(moi.role)) { envoyer(res, 403, { erreur: "Accès refusé pour ce rôle" }); return false; }
    return true;
  };

  /* ---------- Authentification ---------- */

  if (chemin === "/auth/inscription" && methode === "POST") {
    const { nom, telephone, motDePasse, role, localite, societe, email } = corps;
    if (!nom || !telephone || !motDePasse || !role)
      return envoyer(res, 400, { erreur: "Nom, téléphone, mot de passe et rôle sont obligatoires" });
    if (!["planteur", "acheteur"].includes(role))
      return envoyer(res, 400, { erreur: "Rôle invalide" });
    if (String(motDePasse).length < 6)
      return envoyer(res, 400, { erreur: "Le mot de passe doit contenir au moins 6 caractères" });

    const existe = await pool.query("select 1 from utilisateurs where telephone = $1", [telephone]);
    if (existe.rows[0])
      return envoyer(res, 409, { erreur: "Ce numéro de téléphone est déjà enregistré" });

    const mp = creerMotDePasse(motDePasse);
    const { rows } = await pool.query(
      `insert into utilisateurs (nom, role, telephone, localite, societe, email, actif, verifie, sel, hash, date_creation)
       values ($1,$2,$3,$4,$5,$6,true,false,$7,$8,now()) returning *`,
      [nom, role, telephone, localite || "", societe || "", email || "", mp.sel, mp.hash]
    );
    const u = M.versUtilisateur(rows[0]);
    const token = crypto.randomBytes(24).toString("hex");
    await pool.query("insert into sessions (token, utilisateur_id) values ($1,$2)", [token, u.id]);
    await journaliser(nom, "inscription", `Nouveau compte ${role}`);
    return envoyer(res, 201, { token, utilisateur: publicUtilisateur(u) });
  }

  if (chemin === "/auth/connexion" && methode === "POST") {
    const { telephone, motDePasse } = corps;
    const { rows } = await pool.query("select * from utilisateurs where telephone = $1", [telephone]);
    const u = M.versUtilisateur(rows[0]);
    if (!u || !verifierMotDePasse(motDePasse || "", u.sel, u.hash))
      return envoyer(res, 401, { erreur: "Téléphone ou mot de passe incorrect" });
    if (!u.actif) return envoyer(res, 403, { erreur: "Ce compte a été désactivé" });
    const token = crypto.randomBytes(24).toString("hex");
    await pool.query("insert into sessions (token, utilisateur_id) values ($1,$2)", [token, u.id]);
    await journaliser(u.nom, "connexion", `Rôle ${u.role}`);
    return envoyer(res, 200, { token, utilisateur: publicUtilisateur(u) });
  }

  if (chemin === "/auth/moi" && methode === "GET") {
    if (!exige()) return;
    return envoyer(res, 200, publicUtilisateur(moi));
  }

  if (chemin === "/auth/deconnexion" && methode === "POST") {
    if (moi) await pool.query("delete from sessions where token = $1", [moi.token]);
    return envoyer(res, 200, { ok: true });
  }

  if (chemin === "/auth/profil" && methode === "PUT") {
    if (!exige()) return;
    const champs = [];
    const valeurs = [];
    let i = 1;
    ["nom", "localite", "societe", "email"].forEach((k) => {
      if (corps[k] !== undefined) { champs.push(`${k} = $${i++}`); valeurs.push(corps[k]); }
    });
    if (corps.nouveauMotDePasse) {
      const { rows } = await pool.query("select sel, hash from utilisateurs where id = $1", [moi.id]);
      if (!verifierMotDePasse(corps.ancienMotDePasse || "", rows[0].sel, rows[0].hash))
        return envoyer(res, 400, { erreur: "Ancien mot de passe incorrect" });
      if (String(corps.nouveauMotDePasse).length < 6)
        return envoyer(res, 400, { erreur: "Le nouveau mot de passe est trop court" });
      const mp = creerMotDePasse(corps.nouveauMotDePasse);
      champs.push(`sel = $${i++}`); valeurs.push(mp.sel);
      champs.push(`hash = $${i++}`); valeurs.push(mp.hash);
    }
    if (champs.length) {
      valeurs.push(moi.id);
      await pool.query(`update utilisateurs set ${champs.join(", ")} where id = $${i}`, valeurs);
    }
    const { rows } = await pool.query("select * from utilisateurs where id = $1", [moi.id]);
    return envoyer(res, 200, publicUtilisateur(M.versUtilisateur(rows[0])));
  }

  /* ---------- Référentiels publics ---------- */

  if (chemin === "/referentiel" && methode === "GET") {
    const { rows } = await pool.query("select * from parametres where id = 1");
    const p = M.versParametres(rows[0]);
    return envoyer(res, 200, {
      produits: PRODUITS,
      parametres: {
        nomEntreprise: p.nomEntreprise, commissionParKg: p.commissionParKg,
        commissionMin: p.commissionMin, commissionMax: p.commissionMax,
        tarifTransportParKg: p.tarifTransportParKg, devise: p.devise,
        rccm: p.rccm, siege: p.siege, telephone: p.telephone, email: p.email,
        formeJuridique: p.formeJuridique,
      },
    });
  }

  /* ---------- Offres ---------- */

  if (chemin === "/offres" && methode === "GET") {
    const statut = url.searchParams.get("statut");
    const produit = url.searchParams.get("produit");
    const mien = url.searchParams.get("mien") === "1";
    const conditions = [];
    const params = [];
    let i = 1;
    if (mien) {
      if (!exige()) return;
      conditions.push(`o.planteur_id = $${i++}`); params.push(moi.id);
    }
    if (statut) { conditions.push(`o.statut = $${i++}`); params.push(statut); }
    if (produit) { conditions.push(`o.produit = $${i++}`); params.push(produit); }
    const clause = conditions.length ? "where " + conditions.join(" and ") : "";
    return envoyer(res, 200, await offresEnrichies(clause, params));
  }

  if (chemin === "/offres" && methode === "POST") {
    if (!exige(["planteur", "admin"])) return;
    const { produit, quantite, prix, qualite, localite, dateDisponibilite, planteurId } = corps;
    if (!produit || !quantite || !prix)
      return envoyer(res, 400, { erreur: "Produit, quantité et prix sont obligatoires" });
    if (Number(quantite) <= 0 || Number(prix) <= 0)
      return envoyer(res, 400, { erreur: "Quantité et prix doivent être supérieurs à zéro" });
    const idPlanteur = moi.role === "admin" && planteurId ? Number(planteurId) : moi.id;
    const { rows } = await pool.query(
      `insert into offres (planteur_id, produit, quantite, quantite_restante, prix, qualite, localite, date_disponibilite, statut, date_creation)
       values ($1,$2,$3,$3,$4,$5,$6,$7,'disponible', now()) returning id`,
      [idPlanteur, produit, Number(quantite), Number(prix), qualite || "Standard marché",
        localite || moi.localite || "", dateDisponibilite || new Date().toISOString()]
    );
    await journaliser(moi.nom, "offre_creee", `${produit} — ${quantite} kg à ${prix} FCFA/kg`);
    const [offre] = await offresEnrichies("where o.id = $1", [rows[0].id]);
    return envoyer(res, 201, offre);
  }

  const majOffre = chemin.match(/^\/offres\/(\d+)$/);
  if (majOffre && ["PUT", "PATCH", "DELETE"].includes(methode)) {
    if (!exige(["planteur", "admin"])) return;
    const idOffre = Number(majOffre[1]);
    const { rows } = await pool.query("select * from offres where id = $1", [idOffre]);
    const offre = M.versOffre(rows[0]);
    if (!offre) return envoyer(res, 404, { erreur: "Offre introuvable" });
    if (moi.role !== "admin" && offre.planteurId !== moi.id)
      return envoyer(res, 403, { erreur: "Cette offre ne vous appartient pas" });

    if (methode === "DELETE") {
      await pool.query("update offres set statut = 'retiree' where id = $1", [idOffre]);
      await journaliser(moi.nom, "offre_retiree", `Offre n°${idOffre}`);
      const [o] = await offresEnrichies("where o.id = $1", [idOffre]);
      return envoyer(res, 200, o);
    }

    const champs = [];
    const valeurs = [];
    let i = 1;
    if (corps.produit !== undefined) { champs.push(`produit = $${i++}`); valeurs.push(corps.produit); }
    if (corps.qualite !== undefined) { champs.push(`qualite = $${i++}`); valeurs.push(corps.qualite); }
    if (corps.localite !== undefined) { champs.push(`localite = $${i++}`); valeurs.push(corps.localite); }
    if (corps.statut !== undefined) { champs.push(`statut = $${i++}`); valeurs.push(corps.statut); }
    if (corps.prix !== undefined) { champs.push(`prix = $${i++}`); valeurs.push(Number(corps.prix)); }
    if (corps.quantite !== undefined) {
      const vendu = offre.quantite - offre.quantiteRestante;
      const nouvelleQuantite = Number(corps.quantite);
      champs.push(`quantite = $${i++}`); valeurs.push(nouvelleQuantite);
      champs.push(`quantite_restante = $${i++}`); valeurs.push(Math.max(0, nouvelleQuantite - vendu));
    }
    if (champs.length) {
      valeurs.push(idOffre);
      await pool.query(`update offres set ${champs.join(", ")} where id = $${i}`, valeurs);
    }
    await journaliser(moi.nom, "offre_modifiee", `Offre n°${idOffre}`);
    const [o] = await offresEnrichies("where o.id = $1", [idOffre]);
    return envoyer(res, 200, o);
  }

  /* ---------- Commandes ---------- */

  if (chemin === "/commandes" && methode === "GET") {
    if (!exige()) return;
    const conditions = [];
    const params = [];
    let i = 1;
    if (moi.role === "planteur") { conditions.push(`c.planteur_id = $${i++}`); params.push(moi.id); }
    if (moi.role === "acheteur") { conditions.push(`c.acheteur_id = $${i++}`); params.push(moi.id); }
    const statut = url.searchParams.get("statut");
    if (statut) { conditions.push(`c.statut = $${i++}`); params.push(statut); }
    const clause = conditions.length ? "where " + conditions.join(" and ") : "";
    return envoyer(res, 200, await commandesEnrichies(clause, params));
  }

  if (chemin === "/commandes" && methode === "POST") {
    if (!exige(["acheteur", "admin"])) return;
    const { offreId, quantite, lieuLivraison, modePaiement, transportParEko, acheteurId } = corps;
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rows: offreRows } = await client.query("select * from offres where id = $1 for update", [Number(offreId)]);
      const offre = M.versOffre(offreRows[0]);
      if (!offre) { await client.query("rollback"); return envoyer(res, 404, { erreur: "Offre introuvable" }); }
      if (offre.statut !== "disponible") { await client.query("rollback"); return envoyer(res, 409, { erreur: "Cette offre n'est plus disponible" }); }
      const q = Number(quantite);
      if (!q || q <= 0) { await client.query("rollback"); return envoyer(res, 400, { erreur: "Quantité invalide" }); }
      if (q > offre.quantiteRestante) {
        await client.query("rollback");
        return envoyer(res, 409, { erreur: `Quantité supérieure au stock restant (${offre.quantiteRestante} kg)` });
      }

      const { rows: paramRows } = await client.query("select * from parametres where id = 1");
      const p = M.versParametres(paramRows[0]);

      const idAcheteur = moi.role === "admin" && acheteurId ? Number(acheteurId) : moi.id;
      const avecTransport = transportParEko !== false;
      const montantProduits = q * offre.prix;
      const commission = q * p.commissionParKg;
      const fraisTransport = avecTransport ? q * p.tarifTransportParKg : 0;

      const { rows: seqRows } = await client.query("select nextval(pg_get_serial_sequence('commandes','id')) as n");
      const idCommande = seqRows[0].n;
      const reference = "CMD-" + String(idCommande).padStart(4, "0");
      const maintenant = new Date().toISOString();
      const historique = JSON.stringify([{ date: maintenant, statut: "en_attente", par: moi.nom }]);

      await client.query(
        `insert into commandes (id, reference, offre_id, acheteur_id, planteur_id, produit, quantite, prix_kg,
           montant_produits, commission, frais_transport, montant_total, statut, transporteur_id,
           lieu_livraison, mode_paiement, transport_par_eko, date_creation, historique)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'en_attente',null,$13,$14,$15,$16,$17)`,
        [idCommande, reference, offre.id, idAcheteur, offre.planteurId, offre.produit, q, offre.prix,
          montantProduits, commission, fraisTransport, montantProduits + fraisTransport,
          lieuLivraison || "Abidjan", modePaiement || "mobile_money", avecTransport, maintenant, historique]
      );

      const nouvelleRestante = offre.quantiteRestante - q;
      await client.query(
        "update offres set quantite_restante = $1, statut = case when $1 = 0 then 'epuisee' else statut end where id = $2",
        [nouvelleRestante, offre.id]
      );

      await client.query("commit");
      await journaliser(moi.nom, "commande_creee", `${reference} — ${offre.produit} ${q} kg`);
      const [c] = await commandesEnrichies("where c.id = $1", [idCommande]);
      return envoyer(res, 201, c);
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }

  const actionCommande = chemin.match(/^\/commandes\/(\d+)\/(\w+)$/);
  if (actionCommande && methode === "POST") {
    if (!exige()) return;
    const idCommande = Number(actionCommande[1]);
    const { rows } = await pool.query("select * from commandes where id = $1", [idCommande]);
    const c = M.versCommande(rows[0]);
    if (!c) return envoyer(res, 404, { erreur: "Commande introuvable" });
    const action = actionCommande[2];

    const cibles = {
      accepter: "acceptee", refuser: "refusee", annuler: "annulee",
      expedier: "en_transport", livrer: "livree", payer: "payee",
    };
    const cible = cibles[action];
    if (!cible) return envoyer(res, 404, { erreur: "Action inconnue" });

    const droits = {
      accepter: ["planteur", "admin"], refuser: ["planteur", "admin"],
      annuler: ["acheteur", "admin"], expedier: ["admin"],
      livrer: ["admin"], payer: ["admin"],
    };
    if (!droits[action].includes(moi.role))
      return envoyer(res, 403, { erreur: "Votre rôle ne permet pas cette action" });
    if (moi.role === "planteur" && c.planteurId !== moi.id)
      return envoyer(res, 403, { erreur: "Cette commande ne vous concerne pas" });
    if (moi.role === "acheteur" && c.acheteurId !== moi.id)
      return envoyer(res, 403, { erreur: "Cette commande ne vous concerne pas" });
    if (!TRANSITIONS[c.statut].includes(cible))
      return envoyer(res, 409, { erreur: `Transition impossible depuis le statut « ${c.statut} »` });

    const maintenant = new Date().toISOString();
    const champs = ["statut = $1"];
    const valeurs = [cible];
    let i = 2;
    if (cible === "acceptee") { champs.push(`date_acceptation = $${i++}`); valeurs.push(maintenant); }
    if (cible === "en_transport") {
      if (corps.transporteurId) { champs.push(`transporteur_id = $${i++}`); valeurs.push(Number(corps.transporteurId)); }
      champs.push(`date_expedition = $${i++}`); valeurs.push(maintenant);
    }
    if (cible === "livree") { champs.push(`date_livraison = $${i++}`); valeurs.push(maintenant); }
    if (cible === "payee") {
      champs.push(`date_paiement = $${i++}`); valeurs.push(maintenant);
      if (corps.modePaiement) { champs.push(`mode_paiement = $${i++}`); valeurs.push(corps.modePaiement); }
    }
    const historique = [...c.historique, { date: maintenant, statut: cible, par: moi.nom }];
    champs.push(`historique = $${i++}`); valeurs.push(JSON.stringify(historique));
    valeurs.push(idCommande);
    await pool.query(`update commandes set ${champs.join(", ")} where id = $${i}`, valeurs);

    if (["refusee", "annulee"].includes(cible)) {
      await pool.query(
        `update offres set quantite_restante = quantite_restante + $1,
           statut = case when statut = 'epuisee' then 'disponible' else statut end
         where id = $2`,
        [c.quantite, c.offreId]
      );
    }
    await journaliser(moi.nom, "commande_" + cible, c.reference);
    const [commandeMaj] = await commandesEnrichies("where c.id = $1", [idCommande]);
    return envoyer(res, 200, commandeMaj);
  }

  /* ---------- Transporteurs ---------- */

  if (chemin === "/transporteurs" && methode === "GET") {
    if (!exige()) return;
    const { rows } = await pool.query("select * from transporteurs order by id");
    return envoyer(res, 200, rows.map(M.versTransporteur));
  }

  if (chemin === "/transporteurs" && methode === "POST") {
    if (!exige(["admin"])) return;
    const { nom, telephone, vehicule, capaciteKg, zone, tarifKg } = corps;
    if (!nom || !telephone) return envoyer(res, 400, { erreur: "Nom et téléphone obligatoires" });
    const { rows: paramRows } = await pool.query("select tarif_transport_par_kg from parametres where id = 1");
    const { rows } = await pool.query(
      `insert into transporteurs (nom, telephone, vehicule, capacite_kg, zone, tarif_kg, actif)
       values ($1,$2,$3,$4,$5,$6,true) returning *`,
      [nom, telephone, vehicule || "", Number(capaciteKg) || 0, zone || "",
        Number(tarifKg) || paramRows[0].tarif_transport_par_kg]
    );
    await journaliser(moi.nom, "transporteur_ajoute", nom);
    return envoyer(res, 201, M.versTransporteur(rows[0]));
  }

  const majTransporteur = chemin.match(/^\/transporteurs\/(\d+)$/);
  if (majTransporteur && ["PUT", "PATCH"].includes(methode)) {
    if (!exige(["admin"])) return;
    const idTransporteur = Number(majTransporteur[1]);
    const { rows: existant } = await pool.query("select * from transporteurs where id = $1", [idTransporteur]);
    if (!existant[0]) return envoyer(res, 404, { erreur: "Transporteur introuvable" });
    const t = M.versTransporteur(existant[0]);
    const { rows } = await pool.query(
      `update transporteurs set nom = $1, telephone = $2, vehicule = $3, zone = $4,
         capacite_kg = $5, tarif_kg = $6, actif = $7
       where id = $8 returning *`,
      [
        corps.nom ?? t.nom, corps.telephone ?? t.telephone,
        corps.vehicule ?? t.vehicule, corps.zone ?? t.zone,
        corps.capaciteKg !== undefined ? Number(corps.capaciteKg) : t.capaciteKg,
        corps.tarifKg !== undefined ? Number(corps.tarifKg) : t.tarifKg,
        corps.actif !== undefined ? !!corps.actif : t.actif,
        idTransporteur,
      ]
    );
    return envoyer(res, 200, M.versTransporteur(rows[0]));
  }

  /* ---------- Utilisateurs (admin) ---------- */

  if (chemin === "/utilisateurs" && methode === "GET") {
    if (!exige(["admin"])) return;
    const role = url.searchParams.get("role");
    const { rows } = await pool.query(
      role ? "select * from utilisateurs where role = $1 order by id" : "select * from utilisateurs order by id",
      role ? [role] : []
    );
    const utilisateurs = rows.map(M.versUtilisateur);
    const { rows: commandesRows } = await pool.query("select * from commandes");
    const commandes = commandesRows.map(M.versCommande);
    return envoyer(res, 200, utilisateurs.map((u) => {
      const mesCommandes = commandes.filter((c) => c.planteurId === u.id || c.acheteurId === u.id);
      const realisees = mesCommandes.filter((c) => ["livree", "payee"].includes(c.statut));
      return {
        ...publicUtilisateur(u),
        transactions: realisees.length,
        volumeKg: realisees.reduce((s, c) => s + c.quantite, 0),
        chiffre: realisees.reduce((s, c) => s + c.montantTotal, 0),
      };
    }));
  }

  const majUtilisateur = chemin.match(/^\/utilisateurs\/(\d+)$/);
  if (majUtilisateur && ["PUT", "PATCH"].includes(methode)) {
    if (!exige(["admin"])) return;
    const idUtilisateur = Number(majUtilisateur[1]);
    const { rows: existant } = await pool.query("select * from utilisateurs where id = $1", [idUtilisateur]);
    if (!existant[0]) return envoyer(res, 404, { erreur: "Utilisateur introuvable" });
    const u = M.versUtilisateur(existant[0]);
    if (u.role === "admin" && corps.actif === false)
      return envoyer(res, 409, { erreur: "Impossible de désactiver un administrateur" });

    const champs = [];
    const valeurs = [];
    let i = 1;
    ["nom", "localite", "societe", "email"].forEach((k) => {
      if (corps[k] !== undefined) { champs.push(`${k} = $${i++}`); valeurs.push(corps[k]); }
    });
    if (corps.actif !== undefined) { champs.push(`actif = $${i++}`); valeurs.push(!!corps.actif); }
    if (corps.verifie !== undefined) { champs.push(`verifie = $${i++}`); valeurs.push(!!corps.verifie); }
    if (champs.length) {
      valeurs.push(idUtilisateur);
      await pool.query(`update utilisateurs set ${champs.join(", ")} where id = $${i}`, valeurs);
    }
    await journaliser(moi.nom, "utilisateur_modifie", u.nom);
    const { rows } = await pool.query("select * from utilisateurs where id = $1", [idUtilisateur]);
    return envoyer(res, 200, publicUtilisateur(M.versUtilisateur(rows[0])));
  }

  /* ---------- Statistiques ---------- */

  if (chemin === "/stats" && methode === "GET") {
    if (!exige(["admin"])) return;
    const { rows } = await pool.query("select * from parametres where id = 1");
    return envoyer(res, 200, await statistiques(M.versParametres(rows[0])));
  }

  if (chemin === "/stats/moi" && methode === "GET") {
    if (!exige(["planteur", "acheteur"])) return;
    return envoyer(res, 200, await statistiquesUtilisateur(moi));
  }

  /* ---------- Paramètres & journal ---------- */

  if (chemin === "/parametres" && methode === "GET") {
    if (!exige(["admin"])) return;
    const { rows } = await pool.query("select * from parametres where id = 1");
    return envoyer(res, 200, M.versParametres(rows[0]));
  }

  if (chemin === "/parametres" && methode === "PUT") {
    if (!exige(["admin"])) return;
    const { rows } = await pool.query("select * from parametres where id = 1");
    const p = M.versParametres(rows[0]);
    const colonnes = {
      nomEntreprise: "nom_entreprise", formeJuridique: "forme_juridique", rccm: "rccm",
      siege: "siege", telephone: "telephone", email: "email", devise: "devise",
    };
    const colonnesNum = {
      commissionParKg: "commission_par_kg", commissionMin: "commission_min",
      commissionMax: "commission_max", tarifTransportParKg: "tarif_transport_par_kg",
      objectifMensuelKg: "objectif_mensuel_kg", objectifRevenuMensuel: "objectif_revenu_mensuel",
    };
    const champs = [];
    const valeurs = [];
    let i = 1;
    const fusion = { ...p };
    Object.entries(colonnes).forEach(([k, col]) => {
      if (corps[k] !== undefined) { champs.push(`${col} = $${i++}`); valeurs.push(corps[k]); fusion[k] = corps[k]; }
    });
    Object.entries(colonnesNum).forEach(([k, col]) => {
      if (corps[k] !== undefined) { champs.push(`${col} = $${i++}`); valeurs.push(Number(corps[k])); fusion[k] = Number(corps[k]); }
    });
    if (corps.besoinFinancement) {
      fusion.besoinFinancement = Object.assign({}, p.besoinFinancement, corps.besoinFinancement);
      champs.push(`besoin_financement = $${i++}`); valeurs.push(JSON.stringify(fusion.besoinFinancement));
    }
    if (fusion.commissionParKg < fusion.commissionMin || fusion.commissionParKg > fusion.commissionMax)
      return envoyer(res, 400, { erreur: `La commission doit rester entre ${fusion.commissionMin} et ${fusion.commissionMax} FCFA/kg` });
    if (champs.length) {
      await pool.query(`update parametres set ${champs.join(", ")} where id = 1`, valeurs);
    }
    await journaliser(moi.nom, "parametres_modifies", `Commission ${fusion.commissionParKg} FCFA/kg`);
    const { rows: majRows } = await pool.query("select * from parametres where id = 1");
    return envoyer(res, 200, M.versParametres(majRows[0]));
  }

  if (chemin === "/journal" && methode === "GET") {
    if (!exige(["admin"])) return;
    const { rows } = await pool.query("select * from journal order by id desc limit 60");
    return envoyer(res, 200, rows.map(M.versJournal));
  }

  return envoyer(res, 404, { erreur: "Route API inconnue : " + chemin });
}

/* ------------------------------------------------------------------ */

const serveur = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
    return res.end();
  }
  if (url.pathname.startsWith("/api/")) {
    try {
      return await api(req, res, url);
    } catch (e) {
      console.error(e);
      return envoyer(res, 500, { erreur: "Erreur interne du serveur" });
    }
  }
  return servirStatique(req, res, url.pathname);
});

async function demarrer() {
  await assurerDonneesInitiales(pool);
  serveur.listen(PORT, () => {
    console.log(`\n  Eko Corporate — plateforme agricole & logistique`);
    console.log(`  Serveur en ligne : http://localhost:${PORT}`);
    console.log(`  Base de données  : PostgreSQL (Supabase)`);
    console.log(`  Comptes de démonstration :`);
    console.log(`    Admin     → 0700000000 / admin123`);
    console.log(`    Planteur  → 0701010101 / demo1234`);
    console.log(`    Acheteur  → 0705050505 / demo1234\n`);
  });
}

demarrer().catch((e) => {
  console.error("Échec du démarrage du serveur :", e);
  process.exit(1);
});
