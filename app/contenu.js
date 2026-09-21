/* =========================================================
   Eko Corporate — contenu issu du business plan
   (repris intégralement du document fourni, structuré pour l'application)
   ========================================================= */

const BP = {
  resume: {
    objet: "Entreprise spécialisée dans la mise en relation entre planteurs et acheteurs (usines, grossistes, marchés urbains), avec un service intégré de logistique (transport des produits agricoles).",
    objectifs: [
      "Faciliter l'écoulement des productions agricoles",
      "Sécuriser les transactions",
      "Optimiser les circuits de distribution",
    ],
    revenus: ["Commission au kilogramme", "Frais de transport"],
    zone: "Abidjan + zones rurales proches",
  },
  problematique: {
    planteurs: [
      "Difficultés d'accès aux marchés urbains",
      "Dépendance aux intermédiaires informels (pisteurs)",
      "Manque de transparence sur les prix",
      "Pertes post-récolte importantes",
    ],
    acheteurs: ["Manque de fournisseurs fiables"],
    conclusion: "Il existe donc un déséquilibre du marché.",
  },
  solution: {
    axes: [
      "Connecter directement l'offre (planteurs) et la demande (acheteurs)",
      "Garantir la transaction",
      "Organiser la logistique (transport sécurisé)",
    ],
    positionnement: "Facilitateur sécurisé du commerce agricole",
  },
  entreprise: {
    activites: ["Intermédiation commerciale agricole", "Organisation logistique"],
    statut: "SARL (crédibilité + protection juridique)",
    clients: ["Planteurs", "Usines de transformation", "Grossistes", "Marchés urbains"],
  },
  marche: {
    demande: [
      "Forte consommation en produits vivriers en zone urbaine (Abidjan)",
      "Besoins constants des industries agroalimentaires",
    ],
    offre: ["Production abondante mais mal organisée"],
    opportunite: "Structurer la chaîne d'approvisionnement",
    concurrence: ["Pisteurs informels", "Grossistes traditionnels"],
    faiblesses: ["Manque de transparence", "Absence de structuration"],
  },
  modele: {
    commission: "10 à 25 FCFA/kg",
    transport: "Facturé au client ou intégré dans le prix",
    exemple: {
      volume: "20 tonnes/mois (20 000 kg)",
      commissionMoyenne: "15 FCFA/kg",
      revenuCommission: 300000,
      revenuTransport: "200 000 à 500 000 FCFA",
      total: "500 000 à 800 000 FCFA (début)",
    },
  },
  operations: {
    approvisionnement: ["Réseau de planteurs locaux", "Contrats simples"],
    vente: ["Prospection directe (usines, marchés)"],
    logistique: ["Partenariat transporteurs", "Livraison organisée"],
    process: ["Collecte des offres", "Négociation", "Validation commande", "Transport", "Paiement"],
  },
  marketing: {
    terrain: ["Visites villages", "Démarchage direct"],
    digital: ["WhatsApp Business", "Facebook"],
    reseau: ["Coopératives agricoles", "Associations"],
  },
  organisation: [
    { poste: "Responsable terrain", mission: "Relation planteurs, collecte des offres, contrôle qualité au départ" },
    { poste: "Responsable commercial", mission: "Prospection et suivi des acheteurs (usines, grossistes, marchés)" },
    { poste: "Responsable logistique", mission: "Partenariats transporteurs, planification et suivi des livraisons" },
  ],
  juridique: [
    "Immatriculation au RCCM",
    "Déclaration fiscale",
    "Rédaction de contrats simples : planteur et acheteur",
  ],
  financement: [
    { poste: "Transport (avance / logistique)", montant: 300000 },
    { poste: "Communication", montant: 50000 },
    { poste: "Déplacements", montant: 100000 },
    { poste: "Administratif", montant: 100000 },
  ],
  previsions: {
    objectif: "50 tonnes/mois à terme",
    revenus: "750 000 à 1 500 000 FCFA / mois",
  },
  risques: [
    { risque: "Non-paiement", solution: "Contrats signés et paiement sécurisé via la plateforme" },
    { risque: "Problèmes logistiques", solution: "Réseau de transporteurs partenaires et suivi des livraisons" },
    { risque: "Qualité des produits", solution: "Contrôle qualité au départ et réclamation à la livraison" },
    { risque: "Concurrence informelle", solution: "Transparence des prix et relation de confiance durable" },
  ],
  lancement: [
    { mois: "Mois 1", actions: "Étude terrain, premiers contacts planteurs et acheteurs" },
    { mois: "Mois 2", actions: "Premières transactions et rodage du process" },
    { mois: "Mois 3", actions: "Structuration du réseau de planteurs et de transporteurs" },
  ],
  conclusion: "Ce projet répond à un besoin réel et massif en Côte d'Ivoire. Avec une bonne exécution, il peut évoluer vers une plateforme digitale et une grande entreprise logistique agricole.",
};

/* ---------------- Contrats types (modèles du business plan) ---------------- */

function contratPlanteurType(p) {
  const e = p || {};
  return `CONTRAT DE FOURNITURE AGRICOLE ET D'INTERMÉDIATION

Entre :
La société ${e.nomEntreprise || "Eko Corporate"}, ${e.formeJuridique || "SARL"}, immatriculée au RCCM sous le numéro ${e.rccm || "................"}, dont le siège est situé à ${e.siege || "................"}, représentée par son gérant, ci-après dénommée « l'Intermédiaire »

Et :
Monsieur/Madame ......................................, demeurant à ........................, exploitant agricole, ci-après dénommé(e) « le Fournisseur »

Article 1 : Objet
Le présent contrat a pour objet la mise en relation entre le Fournisseur et des acheteurs, ainsi que l'organisation éventuelle du transport des produits agricoles.

Article 2 : Produits concernés
Le Fournisseur s'engage à fournir les produits suivants :
— Nature : ........................
— Quantité estimée : ................ kg
— Qualité : conforme aux standards du marché

Article 3 : Engagement du Fournisseur
Le Fournisseur s'engage à fournir des produits disponibles et conformes, à respecter les quantités annoncées et à être disponible pour la livraison.

Article 4 : Rôle de l'Intermédiaire
L'Intermédiaire s'engage à rechercher des acheteurs fiables, à négocier les conditions de vente, à organiser le transport si convenu et à assurer le suivi de la transaction.

Article 5 : Prix et commission
Le prix de vente est fixé d'un commun accord entre les parties et l'acheteur.
L'Intermédiaire percevra une commission de ${e.commissionParKg || 15} FCFA par kilogramme vendu (fourchette contractuelle : ${e.commissionMin || 10} à ${e.commissionMax || 25} FCFA/kg).
Cette commission est due uniquement en cas de vente effective.

Article 6 : Transport
Le transport peut être assuré par l'Intermédiaire (facturé séparément ou inclus) ou organisé par l'acheteur. Les modalités sont définies au cas par cas.

Article 7 : Paiement
Le paiement peut se faire directement au Fournisseur avec déduction de la commission, ou via l'Intermédiaire. Les modalités sont précisées avant chaque transaction.

Article 8 : Responsabilité
Le Fournisseur reste responsable de la qualité des produits jusqu'à la livraison. L'Intermédiaire agit en tant que facilitateur et ne saurait être tenu responsable en cas de non-respect des engagements par l'acheteur, sauf faute prouvée.

Article 9 : Durée
Le présent contrat est conclu pour une durée de .......... mois, renouvelable.

Article 10 : Litiges
Tout litige sera réglé à l'amiable. À défaut, les tribunaux compétents du ressort du siège de l'Intermédiaire seront saisis.

Fait à ........................, le ........................

Le Fournisseur                                  L'Intermédiaire
(Signature)                                     (Signature)`;
}

function contratAcheteurType(p) {
  const e = p || {};
  return `CONTRAT D'APPROVISIONNEMENT AGRICOLE ET LOGISTIQUE

Entre :
La société ${e.nomEntreprise || "Eko Corporate"}, ${e.formeJuridique || "SARL"}, immatriculée au RCCM sous le numéro ${e.rccm || "................"}, ci-après dénommée « l'Intermédiaire »

Et :
La société / Monsieur / Madame ........................................, ci-après dénommé(e) « l'Acheteur »

Article 1 : Objet
Le présent contrat a pour objet la fourniture de produits agricoles par l'intermédiaire d'un réseau de producteurs, ainsi que l'organisation du transport.

Article 2 : Produits
— Nature : ........................
— Quantité : ................ kg
— Fréquence : ponctuelle / régulière

Article 3 : Engagement de l'Intermédiaire
L'Intermédiaire s'engage à fournir des produits disponibles, à sélectionner des producteurs fiables, à organiser la livraison et à assurer le suivi.

Article 4 : Prix
Le prix du produit est fixé comme suit : ................ FCFA/kg.
Ce prix inclut ou non : transport (OUI / NON) — commission (OUI / NON).

Article 5 : Paiement
Le paiement se fait avant livraison / à la livraison / après livraison.
Modes acceptés : espèces, mobile money, virement.

Article 6 : Livraison
— Lieu : ........................
— Délai : ........................
Le transfert de responsabilité s'effectue à la livraison.

Article 7 : Commission de l'Intermédiaire
L'Acheteur accepte que l'Intermédiaire perçoive une rémunération incluse dans le prix ou facturée séparément.

Article 8 : Réclamations
Toute réclamation sur la qualité doit être faite immédiatement à la livraison.

Article 9 : Responsabilité
L'Intermédiaire agit comme facilitateur et organisateur logistique. La qualité des produits relève du Fournisseur.

Article 10 : Durée
Contrat valable pour .......... (transaction unique ou durée définie).

Article 11 : Litiges
En cas de litige, les parties privilégient un règlement amiable. À défaut, compétence est attribuée aux juridictions ivoiriennes.

Fait à ........................, le ........................

L'Acheteur                                      L'Intermédiaire
(Signature)                                     (Signature)`;
}

/* ---------------- Documents générés par transaction ---------------- */

function contratTransaction(c, p) {
  const e = p || {};
  const dateRef = dateLongue(c.dateCreation);
  return `CONTRAT D'APPROVISIONNEMENT AGRICOLE ET LOGISTIQUE
Référence : ${c.reference} — document généré automatiquement

Entre :
La société ${e.nomEntreprise || "Eko Corporate"}, ${e.formeJuridique || "SARL"}, RCCM ${e.rccm || "................"}, siège ${e.siege || "Abidjan"}, ci-après « l'Intermédiaire »

Le Fournisseur : ${c.planteurNom}${c.planteurTel ? " (tél. " + c.planteurTel + ")" : ""}
L'Acheteur : ${c.acheteurNom}${c.acheteurTel ? " (tél. " + c.acheteurTel + ")" : ""}

Article 1 : Objet
Vente et livraison du produit désigné ci-dessous, avec organisation du transport par l'Intermédiaire.

Article 2 : Produit
— Nature : ${c.produit}
— Quantité : ${nombre(c.quantite)} kg
— Prix unitaire : ${nombre(c.prixKg)} FCFA/kg
— Qualité : conforme aux standards du marché

Article 3 : Conditions financières
— Montant des produits : ${fcfa(c.montantProduits)}
— Commission de l'Intermédiaire : ${fcfa(c.commission)} (${Math.round(c.commission / c.quantite)} FCFA/kg)
— Frais de transport : ${fcfa(c.fraisTransport)}
— Montant total dû par l'Acheteur : ${fcfa(c.montantTotal)}
— Montant net revenant au Fournisseur : ${fcfa(c.montantProduits - c.commission)}

Article 4 : Livraison
— Lieu de livraison : ${c.lieuLivraison}
— Transporteur : ${c.transporteurNom || "à désigner par l'Intermédiaire"}
Le transfert de responsabilité s'effectue à la livraison.

Article 5 : Paiement
Mode de paiement retenu : ${MODES_PAIEMENT[c.modePaiement] || c.modePaiement}.

Article 6 : Suivi de la transaction
— Commande passée le ${dateRef}
— Acceptation du Fournisseur : ${c.dateAcceptation ? dateLongue(c.dateAcceptation) : "en attente"}
— Expédition : ${c.dateExpedition ? dateLongue(c.dateExpedition) : "non réalisée"}
— Livraison : ${c.dateLivraison ? dateLongue(c.dateLivraison) : "non réalisée"}
— Paiement : ${c.datePaiement ? dateLongue(c.datePaiement) : "non réalisé"}

Article 7 : Réclamations
Toute réclamation sur la qualité doit être faite immédiatement à la livraison.

Article 8 : Responsabilité
Le Fournisseur reste responsable de la qualité des produits jusqu'à la livraison. L'Intermédiaire agit comme facilitateur et organisateur logistique.

Article 9 : Litiges
Règlement à l'amiable privilégié. À défaut, compétence est attribuée aux juridictions ivoiriennes.

Fait à ${e.siege || "Abidjan"}, le ${dateRef}.

Le Fournisseur                L'Acheteur                L'Intermédiaire
(Signature)                   (Signature)               (Signature)`;
}

function bonLivraison(c, p) {
  const e = p || {};
  return `BON DE LIVRAISON
${(e.nomEntreprise || "Eko Corporate").toUpperCase()} — ${e.siege || "Abidjan, Côte d'Ivoire"}
Référence commande : ${c.reference}
Date d'édition : ${dateLongue(new Date().toISOString())}

EXPÉDITEUR (Fournisseur)
${c.planteurNom}${c.planteurTel ? "\nTéléphone : " + c.planteurTel : ""}

DESTINATAIRE (Acheteur)
${c.acheteurNom}${c.acheteurTel ? "\nTéléphone : " + c.acheteurTel : ""}
Lieu de livraison : ${c.lieuLivraison}

TRANSPORT
Transporteur : ${c.transporteurNom || "à désigner"}
Date d'expédition : ${c.dateExpedition ? dateLongue(c.dateExpedition) : "—"}
Date de livraison : ${c.dateLivraison ? dateLongue(c.dateLivraison) : "—"}

MARCHANDISE
Produit : ${c.produit}
Quantité : ${nombre(c.quantite)} kg
Prix unitaire : ${nombre(c.prixKg)} FCFA/kg
Valeur marchandise : ${fcfa(c.montantProduits)}

RÉSERVES ÉVENTUELLES À LA RÉCEPTION
....................................................................
....................................................................

Signature du transporteur              Signature du destinataire`;
}

function facture(c, p) {
  const e = p || {};
  return `FACTURE ${c.reference.replace("CMD", "FAC")}
${(e.nomEntreprise || "Eko Corporate").toUpperCase()} — ${e.formeJuridique || "SARL"}
RCCM : ${e.rccm || "................"} — ${e.siege || "Abidjan, Côte d'Ivoire"}
Téléphone : ${e.telephone || "—"} — ${e.email || "—"}

Facturé à : ${c.acheteurNom}
Date : ${dateLongue(c.dateLivraison || c.dateCreation)}
Commande : ${c.reference}

DÉSIGNATION                          QUANTITÉ        P.U.            MONTANT
${c.produit.padEnd(34, " ")}${(nombre(c.quantite) + " kg").padEnd(16, " ")}${(nombre(c.prixKg) + " F").padEnd(16, " ")}${fcfa(c.montantProduits)}
Prestation logistique (transport)                                     ${fcfa(c.fraisTransport)}

                                        TOTAL À PAYER : ${fcfa(c.montantTotal)}

Dont commission d'intermédiation Eko Corporate : ${fcfa(c.commission)}
Mode de paiement : ${MODES_PAIEMENT[c.modePaiement] || c.modePaiement}
Statut : ${c.statut === "payee" ? "PAYÉE le " + dateLongue(c.datePaiement) : "EN ATTENTE DE RÈGLEMENT"}

Conditions : toute réclamation sur la qualité doit être formulée à la livraison.
Règlement des litiges à l'amiable, à défaut juridictions ivoiriennes compétentes.`;
}

function recuPlanteur(c, p) {
  const e = p || {};
  return `REÇU DE PAIEMENT AU FOURNISSEUR
${(e.nomEntreprise || "Eko Corporate").toUpperCase()} — ${e.siege || "Abidjan"}
Référence : ${c.reference.replace("CMD", "REC")}

Bénéficiaire : ${c.planteurNom}
Date : ${dateLongue(c.datePaiement || new Date().toISOString())}

Produit : ${c.produit} — ${nombre(c.quantite)} kg à ${nombre(c.prixKg)} FCFA/kg
Montant brut de la vente : ${fcfa(c.montantProduits)}
Commission d'intermédiation déduite : − ${fcfa(c.commission)}
------------------------------------------------------------
NET VERSÉ AU FOURNISSEUR : ${fcfa(c.montantProduits - c.commission)}

Mode de règlement : ${MODES_PAIEMENT[c.modePaiement] || c.modePaiement}

Le Fournisseur (signature)              Pour ${e.nomEntreprise || "Eko Corporate"}`;
}
