/* =========================================================
   Eko Corporate — back-office Administrateur
   ========================================================= */

function TdbAdmin({ stats, commandes, journal, onNaviguer }) {
  if (!stats) return <Vide texte="Chargement du tableau de bord…" />;
  const k = stats.kpi;
  const aTraiter = commandes.filter((c) => ["en_attente", "acceptee"].includes(c.statut));

  return (
    <div>
      <div className="kpis">
        <Kpi libelle="Volume du mois" valeur={tonnes(k.volumeMoisKg)}
          detail={<>Objectif : {tonnes(k.objectifMensuelKg)} — <strong>{k.tauxObjectif}%</strong> atteint</>}
          progression={k.tauxObjectif} />
        <Kpi libelle="Revenu du mois" valeur={fcfa(k.revenuMois)}
          detail={`Commission ${fcfa(k.commissionMois)} + transport ${fcfa(k.transportMois)}`}
          progression={k.objectifRevenuMensuel ? (k.revenuMois / k.objectifRevenuMensuel) * 100 : 0} />
        <Kpi libelle="Volume d'affaires" valeur={fcfa(k.volumeAffaires)} detail={`${k.transactionsTotal} transaction(s) réalisée(s)`} />
        <Kpi libelle="À traiter" valeur={k.commandesAtraiter} alerte={k.commandesAtraiter > 0}
          detail={`${fcfa(k.enAttentePaiement)} en attente de paiement`} />
      </div>

      <div className="kpis">
        <Kpi libelle="Planteurs" valeur={k.planteurs} detail={k.planteursAValider ? `${k.planteursAValider} à vérifier` : "Tous vérifiés"} alerte={k.planteursAValider > 0} />
        <Kpi libelle="Acheteurs" valeur={k.acheteurs} detail="Usines, grossistes, marchés" />
        <Kpi libelle="Stock en ligne" valeur={tonnes(k.stockDisponibleKg)} detail={`${k.offresActives} offre(s) active(s)`} />
        <Kpi libelle="Commission moyenne" valeur={`${k.commissionMoyenneKg || 0} F/kg`} detail={`Panier moyen : ${fcfa(k.panierMoyen)}`} />
      </div>

      <div className="duo">
        <Carte titre="Volumes traités" sous="6 derniers mois, en kilogrammes">
          <GrapheColonnes donnees={stats.serie} cleValeur="volumeKg" format={nombre} />
        </Carte>
        <Carte titre="Mix produits" sous="Part du volume total">
          <GrapheAnneau donnees={stats.parProduit} />
        </Carte>
      </div>

      <div className="duo">
        <Carte titre="Revenus d'intermédiation" sous="Commission encaissée par mois">
          <GrapheCourbe donnees={stats.serie} cleValeur="commission" format={fcfa} />
          <div className="legende"><span><i style={{ background: "#1f7a3d" }} />Commission mensuelle</span></div>
        </Carte>
        <Carte titre="Top planteurs" sous="Par volume livré">
          <BarresHorizontales donnees={stats.parPlanteur} cleNom="nom" cleValeur="volumeKg" format={kg} />
        </Carte>
      </div>

      <div className="duo">
        <Carte titre="Commandes à traiter" sous="En attente de validation ou d'expédition" serre
          actions={<Bouton variante="fantome" petit onClick={() => onNaviguer("commandes")}>Ouvrir</Bouton>}>
          <Tableau
            cle="id"
            colonnes={[{ titre: "Réf." }, { titre: "Produit" }, { titre: "Acheteur" }, { titre: "Qté", num: true }, { titre: "Statut" }]}
            lignes={aTraiter.slice(0, 6)}
            vide="Rien à traiter, tout est à jour."
            rendu={(c) => (
              <>
                <td className="cellule-titre">{c.reference}</td>
                <td>{c.produit}</td>
                <td>{c.acheteurNom}</td>
                <td className="num">{kg(c.quantite)}</td>
                <td><Badge statut={c.statut} /></td>
              </>
            )}
          />
        </Carte>

        <Carte titre="Activité récente" sous="Journal des opérations">
          <ul className="chrono">
            {journal.slice(0, 7).map((j) => (
              <li key={j.id}>
                <strong>{j.details}</strong>
                <div className="quand">{dateHeure(j.date)} — {j.acteur}</div>
              </li>
            ))}
            {!journal.length && <li>Aucune activité enregistrée.</li>}
          </ul>
        </Carte>
      </div>
    </div>
  );
}

/* ---------------- Commandes (admin) ---------------- */

function CommandesAdmin({ commandes, transporteurs, parametres, recharger, message, setMessage }) {
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [detail, setDetail] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [expedition, setExpedition] = useState(null);

  const agir = async (c, action, libelle, corps) => {
    try {
      await Api.post(`/commandes/${c.id}/${action}`, corps || {});
      setMessage({ type: "ok", texte: `${c.reference} : ${libelle}.` });
      setDetail(null); setExpedition(null);
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const liste = useMemo(() => {
    let l = filtre === "tous" ? commandes : commandes.filter((c) => c.statut === filtre);
    return filtrerTexte(l, recherche, ["reference", "produit", "planteurNom", "acheteurNom", "lieuLivraison"]);
  }, [commandes, filtre, recherche]);
  const compter = (s) => commandes.filter((c) => c.statut === s).length;

  return (
    <div>
      <Message message={message} />
      <div className="outils">
        <input placeholder="Rechercher une référence, un produit, une partie…" value={recherche}
          onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 300 }} />
        <Onglets valeur={filtre} onChange={setFiltre} valeurs={[
          { cle: "tous", libelle: "Toutes", compteur: commandes.length },
          { cle: "en_attente", libelle: "En attente", compteur: compter("en_attente") },
          { cle: "acceptee", libelle: "À expédier", compteur: compter("acceptee") },
          { cle: "en_transport", libelle: "En transport", compteur: compter("en_transport") },
          { cle: "livree", libelle: "À encaisser", compteur: compter("livree") },
          { cle: "payee", libelle: "Payées", compteur: compter("payee") },
        ]} />
        <Bouton variante="fantome" petit onClick={() => exporterCsv("commandes.csv",
          ["Référence", "Date", "Produit", "Planteur", "Acheteur", "Quantité (kg)", "Prix/kg", "Commission", "Transport", "Total", "Statut"],
          liste.map((c) => [c.reference, dateCourte(c.dateCreation), c.produit, c.planteurNom, c.acheteurNom, c.quantite, c.prixKg, c.commission, c.fraisTransport, c.montantTotal, LIBELLES_STATUT[c.statut]]))}>
          Exporter CSV
        </Bouton>
      </div>

      <Carte serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Date" }, { titre: "Produit" }, { titre: "Planteur" }, { titre: "Acheteur" },
            { titre: "Qté", num: true }, { titre: "Commission", num: true }, { titre: "Total", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Aucune commande ne correspond à ce filtre."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{dateCourte(c.dateCreation)}</td>
              <td>{c.produit}</td>
              <td>{c.planteurNom}</td>
              <td>{c.acheteurNom}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td className="num"><strong>{fcfa(c.commission)}</strong></td>
              <td className="num">{fcfa(c.montantTotal)}</td>
              <td><Badge statut={c.statut} /></td>
              <td><div className="actions-ligne">
                {c.statut === "acceptee" && <Bouton petit onClick={() => setExpedition(c)}>Expédier</Bouton>}
                {c.statut === "en_transport" && <Bouton petit onClick={() => agir(c, "livrer", "livraison confirmée")}>Livrée</Bouton>}
                {c.statut === "livree" && <Bouton petit onClick={() => agir(c, "payer", "paiement enregistré")}>Encaisser</Bouton>}
                <Bouton variante="fantome" petit onClick={() => setDetail(c)}>Détail</Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>

      {expedition && (
        <ModaleExpedition commande={expedition} transporteurs={transporteurs}
          onFermer={() => setExpedition(null)}
          onValider={(transporteurId) => agir(expedition, "expedier", "expédition lancée", { transporteurId })} />
      )}

      {detail && (
        <Modale titre={"Commande " + detail.reference} taille="large" onFermer={() => setDetail(null)}
          pied={<>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Contrat " + detail.reference, texte: contratTransaction(detail, parametres) })}>Contrat</Bouton>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Facture " + detail.reference, texte: facture(detail, parametres) })}>Facture</Bouton>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Bon de livraison " + detail.reference, texte: bonLivraison(detail, parametres) })}>Bon de livraison</Bouton>
            {detail.statut === "payee" && <Bouton variante="fantome" onClick={() => setApercu({ titre: "Reçu " + detail.reference, texte: recuPlanteur(detail, parametres) })}>Reçu planteur</Bouton>}
          </>}>
          <RecapCommande c={detail} />
          <div className="total-ligne"><span>Montant des produits</span><span>{fcfa(detail.montantProduits)}</span></div>
          <div className="total-ligne"><span>Commission Eko</span><span>{fcfa(detail.commission)}</span></div>
          <div className="total-ligne"><span>Frais de transport</span><span>{fcfa(detail.fraisTransport)}</span></div>
          <div className="total-ligne final"><span>Facturé à l'acheteur</span><span>{fcfa(detail.montantTotal)}</span></div>
          <div className="total-ligne"><span>Reversé au planteur</span><span>{fcfa(detail.netPlanteur)}</span></div>
          <div className="total-ligne final"><span>Marge Eko</span><span>{fcfa(detail.commission + detail.fraisTransport)}</span></div>
          <h4 style={{ marginTop: 22, marginBottom: 12, color: "var(--vert-nuit)" }}>Suivi</h4>
          <ChronologieCommande commande={detail} />
        </Modale>
      )}

      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

function ModaleExpedition({ commande, transporteurs, onFermer, onValider }) {
  const actifs = transporteurs.filter((t) => t.actif);
  const [choix, setChoix] = useState(actifs[0] ? String(actifs[0].id) : "");
  const t = actifs.find((x) => String(x.id) === choix);
  return (
    <Modale titre={"Expédier " + commande.reference} onFermer={onFermer}
      pied={<>
        <Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
        <Bouton onClick={() => onValider(choix)} disabled={!choix}>Lancer l'expédition</Bouton>
      </>}>
      <div className="recap">
        <div><span>Produit</span><strong>{commande.produit}</strong></div>
        <div><span>Quantité</span><strong>{kg(commande.quantite)}</strong></div>
        <div><span>Enlèvement</span><strong>{commande.planteurNom}</strong></div>
        <div><span>Livraison</span><strong>{commande.lieuLivraison}</strong></div>
      </div>
      <div className="champ">
        <label>Transporteur à affecter</label>
        <select value={choix} onChange={(e) => setChoix(e.target.value)}>
          {actifs.map((x) => (
            <option key={x.id} value={x.id}>{x.nom} — {x.vehicule} ({nombre(x.capaciteKg)} kg) — {x.zone}</option>
          ))}
        </select>
      </div>
      {t && t.capaciteKg < commande.quantite && (
        <div className="msg info">
          Attention : la capacité du véhicule ({kg(t.capaciteKg)}) est inférieure à la quantité à charger.
          Prévoyez plusieurs rotations.
        </div>
      )}
      {t && (
        <div className="total-ligne"><span>Coût transport facturé à l'acheteur</span><span>{fcfa(commande.fraisTransport)}</span></div>
      )}
    </Modale>
  );
}

/* ---------------- Offres (admin) ---------------- */

function OffresAdmin({ offres, message, setMessage, recharger }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");

  const retirer = async (o) => {
    if (!window.confirm(`Retirer l'offre « ${o.produit} » de ${o.planteurNom} ?`)) return;
    try {
      await Api.supprimer("/offres/" + o.id);
      setMessage({ type: "ok", texte: "Offre retirée du marché." });
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const liste = useMemo(() => {
    let l = filtre === "tous" ? offres : offres.filter((o) => o.statut === filtre);
    return filtrerTexte(l, recherche, ["produit", "planteurNom", "localite"]);
  }, [offres, filtre, recherche]);

  return (
    <div>
      <Message message={message} />
      <div className="kpis k3">
        <Kpi libelle="Offres actives" valeur={offres.filter((o) => o.statut === "disponible").length} detail="Visibles sur le marché" />
        <Kpi libelle="Stock référencé" valeur={tonnes(offres.filter((o) => o.statut === "disponible").reduce((s, o) => s + o.quantiteRestante, 0))} detail="Quantité restante disponible" />
        <Kpi libelle="Valeur du stock" valeur={fcfa(offres.filter((o) => o.statut === "disponible").reduce((s, o) => s + o.quantiteRestante * o.prix, 0))} detail="Au prix planteur affiché" />
      </div>

      <div className="outils">
        <input placeholder="Rechercher un produit, un planteur…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 280 }} />
        <Onglets valeur={filtre} onChange={setFiltre} valeurs={[
          { cle: "tous", libelle: "Toutes", compteur: offres.length },
          { cle: "disponible", libelle: "Disponibles", compteur: offres.filter((o) => o.statut === "disponible").length },
          { cle: "epuisee", libelle: "Épuisées", compteur: offres.filter((o) => o.statut === "epuisee").length },
          { cle: "retiree", libelle: "Retirées", compteur: offres.filter((o) => o.statut === "retiree").length },
        ]} />
      </div>

      <Carte serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Produit" }, { titre: "Planteur" }, { titre: "Localité" }, { titre: "Publiée" },
            { titre: "Initial", num: true }, { titre: "Restant", num: true }, { titre: "Prix/kg", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Aucune offre enregistrée."
          rendu={(o) => (
            <>
              <td><div className="cellule-titre">{o.produit}</div><div className="cellule-sous">{o.qualite}</div></td>
              <td>{o.planteurNom} {!o.planteurVerifie && <Badge statut="en_attente" texte="Non vérifié" />}</td>
              <td>{o.localite || "—"}</td>
              <td>{dateCourte(o.dateCreation)}</td>
              <td className="num">{kg(o.quantite)}</td>
              <td className="num">{kg(o.quantiteRestante)}</td>
              <td className="num">{nombre(o.prix)} F</td>
              <td><Badge statut={o.statut} /></td>
              <td><div className="actions-ligne">
                {o.statut === "disponible" && <Bouton variante="danger" petit onClick={() => retirer(o)}>Retirer</Bouton>}
              </div></td>
            </>
          )}
        />
      </Carte>
    </div>
  );
}

/* ---------------- Logistique ---------------- */

function LogistiqueAdmin({ commandes, transporteurs, recharger, message, setMessage }) {
  const [form, setForm] = useState({ nom: "", telephone: "", vehicule: "", capaciteKg: "", zone: "", tarifKg: "" });
  const [ouvert, setOuvert] = useState(false);

  const ajouter = async (e) => {
    e.preventDefault();
    try {
      await Api.post("/transporteurs", form);
      setForm({ nom: "", telephone: "", vehicule: "", capaciteKg: "", zone: "", tarifKg: "" });
      setOuvert(false);
      setMessage({ type: "ok", texte: "Transporteur ajouté au réseau." });
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const basculer = async (t) => {
    try {
      await Api.patch("/transporteurs/" + t.id, { actif: !t.actif });
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const enCours = commandes.filter((c) => ["acceptee", "en_transport"].includes(c.statut));
  const charge = {};
  commandes.filter((c) => c.transporteurId && ["en_transport", "livree", "payee"].includes(c.statut))
    .forEach((c) => { charge[c.transporteurId] = (charge[c.transporteurId] || 0) + c.quantite; });

  return (
    <div>
      <Message message={message} />
      <div className="kpis k3">
        <Kpi libelle="Chargements à planifier" valeur={commandes.filter((c) => c.statut === "acceptee").length} alerte={commandes.filter((c) => c.statut === "acceptee").length > 0} detail="Commandes acceptées sans transporteur" />
        <Kpi libelle="En transport" valeur={commandes.filter((c) => c.statut === "en_transport").length} detail="Véhicules en route" />
        <Kpi libelle="Transporteurs actifs" valeur={transporteurs.filter((t) => t.actif).length} detail={`${transporteurs.length} partenaire(s) référencé(s)`} />
      </div>

      <Carte titre="Plan de transport" sous="Commandes acceptées et en cours d'acheminement" serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Réf." }, { titre: "Produit" }, { titre: "Qté", num: true }, { titre: "Enlèvement" },
            { titre: "Livraison" }, { titre: "Transporteur" }, { titre: "Statut" }]}
          lignes={enCours}
          vide="Aucun chargement en cours."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.produit}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td>{c.planteurNom}</td>
              <td>{c.lieuLivraison}</td>
              <td>{c.transporteurNom || <span className="cellule-sous">à affecter</span>}</td>
              <td><Badge statut={c.statut} /></td>
            </>
          )}
        />
      </Carte>

      <Carte titre="Transporteurs partenaires" serre
        actions={<Bouton petit onClick={() => setOuvert(true)}>Ajouter un transporteur</Bouton>}>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Nom" }, { titre: "Téléphone" }, { titre: "Véhicule" }, { titre: "Capacité", num: true },
            { titre: "Zone" }, { titre: "Tarif/kg", num: true }, { titre: "Volume transporté", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={transporteurs}
          vide="Aucun transporteur référencé."
          rendu={(t) => (
            <>
              <td className="cellule-titre">{t.nom}</td>
              <td>{t.telephone}</td>
              <td>{t.vehicule}</td>
              <td className="num">{kg(t.capaciteKg)}</td>
              <td>{t.zone}</td>
              <td className="num">{nombre(t.tarifKg)} F</td>
              <td className="num">{kg(charge[t.id] || 0)}</td>
              <td><Badge statut={t.actif ? "actif" : "inactif"} /></td>
              <td><div className="actions-ligne">
                <Bouton variante={t.actif ? "danger" : "secondaire"} petit onClick={() => basculer(t)}>
                  {t.actif ? "Désactiver" : "Activer"}
                </Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>

      {ouvert && (
        <Modale titre="Nouveau transporteur" onFermer={() => setOuvert(false)}
          pied={<>
            <Bouton variante="fantome" onClick={() => setOuvert(false)}>Annuler</Bouton>
            <Bouton onClick={ajouter}>Enregistrer</Bouton>
          </>}>
          <form onSubmit={ajouter}>
            <div className="grille-2">
              <div className="champ"><label>Nom / société</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Bamba Logistique" /></div>
              <div className="champ"><label>Téléphone</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="07 00 00 00 00" /></div>
              <div className="champ"><label>Véhicule</label>
                <input value={form.vehicule} onChange={(e) => setForm({ ...form, vehicule: e.target.value })} placeholder="Ex : Camion 5T" /></div>
              <div className="champ"><label>Capacité (kg)</label>
                <input type="number" value={form.capaciteKg} onChange={(e) => setForm({ ...form, capaciteKg: e.target.value })} placeholder="5000" /></div>
              <div className="champ"><label>Zone couverte</label>
                <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Ex : Centre – Bouaké" /></div>
              <div className="champ"><label>Tarif (FCFA/kg)</label>
                <input type="number" value={form.tarifKg} onChange={(e) => setForm({ ...form, tarifKg: e.target.value })} placeholder="25" /></div>
            </div>
          </form>
        </Modale>
      )}
    </div>
  );
}

/* ---------------- Réseau (planteurs / acheteurs) ---------------- */

function ReseauAdmin({ role, utilisateurs, recharger, message, setMessage }) {
  const [recherche, setRecherche] = useState("");
  const liste = useMemo(
    () => filtrerTexte(utilisateurs.filter((u) => u.role === role), recherche, ["nom", "telephone", "localite", "societe"]),
    [utilisateurs, role, recherche]
  );

  const majUtilisateur = async (u, champs, texte) => {
    try {
      await Api.patch("/utilisateurs/" + u.id, champs);
      setMessage({ type: "ok", texte });
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const titre = role === "planteur" ? "Planteurs du réseau" : "Acheteurs du réseau";
  const aVerifier = liste.filter((u) => !u.verifie).length;

  return (
    <div>
      <Message message={message} />
      <div className="kpis k3">
        <Kpi libelle={role === "planteur" ? "Planteurs" : "Acheteurs"} valeur={liste.length} detail={`${liste.filter((u) => u.actif).length} compte(s) actif(s)`} />
        <Kpi libelle="À vérifier" valeur={aVerifier} alerte={aVerifier > 0} detail="Comptes en attente de validation" />
        <Kpi libelle="Volume cumulé" valeur={tonnes(liste.reduce((s, u) => s + u.volumeKg, 0))} detail="Sur transactions réalisées" />
      </div>

      <div className="outils">
        <input placeholder="Rechercher un nom, un téléphone, une localité…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 300 }} />
        <Bouton variante="fantome" petit onClick={() => exporterCsv(role + "s.csv",
          ["Nom", "Téléphone", "Localité", "Société", "Transactions", "Volume (kg)", "Chiffre (FCFA)", "Vérifié", "Actif"],
          liste.map((u) => [u.nom, u.telephone, u.localite, u.societe, u.transactions, u.volumeKg, u.chiffre, u.verifie ? "oui" : "non", u.actif ? "oui" : "non"]))}>
          Exporter CSV
        </Bouton>
      </div>

      <Carte titre={titre} serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Nom" }, { titre: "Téléphone" }, { titre: "Localité" }, { titre: "Inscrit le" },
            { titre: "Transactions", num: true }, { titre: "Volume", num: true }, { titre: "Chiffre", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Aucun compte enregistré."
          rendu={(u) => (
            <>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="avatar">{initiales(u.nom)}</div>
                  <div>
                    <div className="cellule-titre">{u.nom}</div>
                    {u.societe && <div className="cellule-sous">{u.societe}</div>}
                  </div>
                </div>
              </td>
              <td>{u.telephone}</td>
              <td>{u.localite || "—"}</td>
              <td>{dateCourte(u.dateCreation)}</td>
              <td className="num">{u.transactions}</td>
              <td className="num">{kg(u.volumeKg)}</td>
              <td className="num">{fcfa(u.chiffre)}</td>
              <td>
                <Badge statut={u.verifie ? "disponible" : "en_attente"} texte={u.verifie ? "Vérifié" : "À vérifier"} />{" "}
                {!u.actif && <Badge statut="inactif" />}
              </td>
              <td><div className="actions-ligne">
                {!u.verifie && <Bouton petit onClick={() => majUtilisateur(u, { verifie: true }, `${u.nom} est désormais vérifié.`)}>Vérifier</Bouton>}
                <Bouton variante={u.actif ? "danger" : "secondaire"} petit
                  onClick={() => majUtilisateur(u, { actif: !u.actif }, `Compte ${u.actif ? "désactivé" : "réactivé"}.`)}>
                  {u.actif ? "Désactiver" : "Réactiver"}
                </Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>
    </div>
  );
}

/* ---------------- Finances ---------------- */

function FinancesAdmin({ stats, commandes, parametres }) {
  const [apercu, setApercu] = useState(null);
  if (!stats) return <Vide texte="Chargement…" />;
  const realisees = commandes.filter((c) => ["livree", "payee"].includes(c.statut));
  const commissionTotale = realisees.reduce((s, c) => s + c.commission, 0);
  const transportTotal = realisees.reduce((s, c) => s + c.fraisTransport, 0);
  const reverse = realisees.reduce((s, c) => s + c.netPlanteur, 0);
  const aEncaisser = commandes.filter((c) => c.statut === "livree").reduce((s, c) => s + c.montantTotal, 0);

  return (
    <div>
      <div className="kpis">
        <Kpi libelle="Revenu total" valeur={fcfa(commissionTotale + transportTotal)} detail="Commission + transport" />
        <Kpi libelle="Commissions" valeur={fcfa(commissionTotale)} detail={`Taux appliqué : ${parametres.commissionParKg} FCFA/kg`} />
        <Kpi libelle="Prestations transport" valeur={fcfa(transportTotal)} detail={`Tarif : ${parametres.tarifTransportParKg} FCFA/kg`} />
        <Kpi libelle="Reversé aux planteurs" valeur={fcfa(reverse)} detail="Net producteur, commission déduite" />
      </div>

      {aEncaisser > 0 && <div className="msg info">{fcfa(aEncaisser)} de factures livrées restent à encaisser.</div>}

      <div className="duo">
        <Carte titre="Structure du revenu mensuel" sous="Commission et transport par mois">
          <GrapheColonnes donnees={stats.serie} cleValeur="commission" format={fcfa} couleur="#145229" />
          <div className="legende"><span><i style={{ background: "#145229" }} />Commission encaissée</span></div>
        </Carte>
        <Carte titre="Revenu par produit" sous="Commission + transport">
          <BarresHorizontales donnees={stats.parProduit} cleNom="produit" cleValeur="revenu" format={fcfa} />
        </Carte>
      </div>

      <Carte titre="Journal des transactions financières" serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Date" }, { titre: "Référence" }, { titre: "Acheteur" }, { titre: "Planteur" },
            { titre: "Facturé", num: true }, { titre: "Commission", num: true }, { titre: "Transport", num: true },
            { titre: "Net planteur", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={realisees}
          vide="Aucune transaction financière enregistrée."
          rendu={(c) => (
            <>
              <td>{dateCourte(c.dateLivraison || c.dateCreation)}</td>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.acheteurNom}</td>
              <td>{c.planteurNom}</td>
              <td className="num">{fcfa(c.montantTotal)}</td>
              <td className="num"><strong>{fcfa(c.commission)}</strong></td>
              <td className="num">{fcfa(c.fraisTransport)}</td>
              <td className="num">{fcfa(c.netPlanteur)}</td>
              <td><Badge statut={c.statut} texte={c.statut === "payee" ? "Encaissé" : "À encaisser"} /></td>
              <td><div className="actions-ligne">
                <Bouton variante="fantome" petit onClick={() => setApercu({ titre: "Facture " + c.reference, texte: facture(c, parametres) })}>Facture</Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>
      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Pilotage business plan ---------------- */

function PilotageAdmin({ stats, parametres }) {
  if (!stats) return <Vide texte="Chargement…" />;
  const k = stats.kpi;
  const financement = parametres.besoinFinancement || {};
  const totalFinancement = Object.values(financement).reduce((s, v) => s + Number(v || 0), 0);
  const revenuBas = 500000, revenuHaut = 800000;

  const lignes = [
    { indicateur: "Volume mensuel", objectif: tonnes(parametres.objectifMensuelKg), realise: tonnes(k.volumeMoisKg), taux: k.tauxObjectif },
    { indicateur: "Revenu mensuel", objectif: fcfa(parametres.objectifRevenuMensuel), realise: fcfa(k.revenuMois), taux: Math.round((k.revenuMois / parametres.objectifRevenuMensuel) * 100) },
    { indicateur: "Commission / kg", objectif: `${parametres.commissionMin}–${parametres.commissionMax} FCFA`, realise: `${k.commissionMoyenneKg || 0} FCFA`, taux: Math.round(((k.commissionMoyenneKg || 0) / parametres.commissionMax) * 100) },
    { indicateur: "Réseau planteurs", objectif: "Réseau structuré", realise: `${k.planteurs} planteur(s)`, taux: Math.min(100, k.planteurs * 10) },
  ];

  return (
    <div>
      <div className="kpis">
        <Kpi libelle="Objectif volume" valeur={`${k.tauxObjectif}%`} progression={k.tauxObjectif}
          detail={`${tonnes(k.volumeMoisKg)} sur ${tonnes(parametres.objectifMensuelKg)} ce mois`} />
        <Kpi libelle="Objectif revenu" valeur={`${Math.round((k.revenuMois / parametres.objectifRevenuMensuel) * 100)}%`}
          progression={(k.revenuMois / parametres.objectifRevenuMensuel) * 100}
          detail={`${fcfa(k.revenuMois)} sur ${fcfa(parametres.objectifRevenuMensuel)}`} />
        <Kpi libelle="Palier de démarrage" valeur={k.revenuMois >= revenuBas ? "Atteint" : "En cours"}
          detail={`Cible business plan : ${fcfa(revenuBas)} – ${fcfa(revenuHaut)} / mois`} />
        <Kpi libelle="Besoin de financement" valeur={fcfa(totalFinancement)} detail="Estimation de démarrage" />
      </div>

      <div className="duo">
        <Carte titre="Objectifs du business plan vs réalisé" serre>
          <Tableau
            colonnes={[{ titre: "Indicateur" }, { titre: "Objectif" }, { titre: "Réalisé" }, { titre: "Avancement" }]}
            lignes={lignes}
            rendu={(l) => (
              <>
                <td className="cellule-titre">{l.indicateur}</td>
                <td>{l.objectif}</td>
                <td>{l.realise}</td>
                <td style={{ minWidth: 160 }}>
                  <div className="jauge"><span style={{ width: Math.min(100, Math.max(0, l.taux)) + "%" }} /></div>
                  <div className="cellule-sous">{Math.max(0, l.taux)}%</div>
                </td>
              </>
            )}
          />
        </Carte>

        <Carte titre="Besoin de financement" sous="Poste par poste, au démarrage" serre>
          <Tableau
            colonnes={[{ titre: "Poste" }, { titre: "Montant", num: true }]}
            lignes={[
              { poste: "Transport (avance / logistique)", montant: financement.transport },
              { poste: "Communication", montant: financement.communication },
              { poste: "Déplacements", montant: financement.deplacements },
              { poste: "Administratif", montant: financement.administratif },
              { poste: "TOTAL", montant: totalFinancement },
            ]}
            rendu={(l) => (
              <>
                <td className={l.poste === "TOTAL" ? "cellule-titre" : ""}>{l.poste}</td>
                <td className="num">{fcfa(l.montant)}</td>
              </>
            )}
          />
        </Carte>
      </div>

      <div className="duo">
        <Carte titre="Risques et parades" serre>
          <Tableau
            colonnes={[{ titre: "Risque" }, { titre: "Parade mise en place" }]}
            lignes={BP.risques}
            rendu={(r) => (<><td className="cellule-titre">{r.risque}</td><td>{r.solution}</td></>)}
          />
        </Carte>
        <Carte titre="Plan de lancement">
          <ul className="chrono">
            {BP.lancement.map((l, i) => (
              <li key={i}><strong>{l.mois}</strong><div className="quand">{l.actions}</div></li>
            ))}
          </ul>
          <div style={{ marginTop: 14, padding: 14, background: "var(--vert-brume)", borderRadius: 8, fontSize: 13, color: "var(--texte-doux)", lineHeight: 1.7 }}>
            {BP.conclusion}
          </div>
        </Carte>
      </div>
    </div>
  );
}

/* ---------------- Contrats (admin) ---------------- */

function ContratsAdmin({ parametres }) {
  const [apercu, setApercu] = useState(null);
  return (
    <div>
      <Carte titre="Modèles contractuels" sous="Documents de référence appliqués à chaque transaction">
        <div className="trio" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="tuile">
            <div className="puce">📄</div>
            <h4>Contrat planteur</h4>
            <p>Fourniture agricole et intermédiation : objet, produits, engagements, commission, transport, paiement, responsabilité, durée, litiges.</p>
            <div style={{ marginTop: 14 }}>
              <Bouton variante="secondaire" petit onClick={() => setApercu({ titre: "Contrat planteur", texte: contratPlanteurType(parametres) })}>Ouvrir</Bouton>
            </div>
          </div>
          <div className="tuile">
            <div className="puce">📄</div>
            <h4>Contrat acheteur</h4>
            <p>Approvisionnement agricole et logistique : produits, prix, paiement, livraison, commission, réclamations, responsabilité, juridiction.</p>
            <div style={{ marginTop: 14 }}>
              <Bouton variante="secondaire" petit onClick={() => setApercu({ titre: "Contrat acheteur", texte: contratAcheteurType(parametres) })}>Ouvrir</Bouton>
            </div>
          </div>
        </div>
      </Carte>

      <Carte titre="Cadre juridique" sous="Obligations de l'entreprise en Côte d'Ivoire">
        <ul className="liste-verte">{BP.juridique.map((j, i) => <li key={i}>{j}</li>)}</ul>
        <div className="recap" style={{ marginTop: 16 }}>
          <div><span>Raison sociale</span><strong>{parametres.nomEntreprise}</strong></div>
          <div><span>Forme juridique</span><strong>{parametres.formeJuridique}</strong></div>
          <div><span>RCCM</span><strong>{parametres.rccm}</strong></div>
          <div><span>Siège</span><strong>{parametres.siege}</strong></div>
        </div>
      </Carte>

      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Paramètres ---------------- */

function ParametresAdmin({ parametres, rafraichirReferentiel, message, setMessage }) {
  const [form, setForm] = useState(parametres);
  useEffect(() => { setForm(parametres); }, [parametres]);

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const majFin = (k) => (e) => setForm({ ...form, besoinFinancement: { ...form.besoinFinancement, [k]: Number(e.target.value) } });

  const enregistrer = async (e) => {
    e.preventDefault();
    try {
      await Api.put("/parametres", form);
      setMessage({ type: "ok", texte: "Paramètres enregistrés. Ils s'appliquent aux nouvelles commandes." });
      rafraichirReferentiel();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const fin = form.besoinFinancement || {};

  return (
    <div>
      <Message message={message} />
      <form onSubmit={enregistrer}>
        <div className="duo">
          <Carte titre="Identité de l'entreprise">
            <div className="grille-2">
              <div className="champ"><label>Raison sociale</label><input value={form.nomEntreprise || ""} onChange={maj("nomEntreprise")} /></div>
              <div className="champ"><label>Forme juridique</label><input value={form.formeJuridique || ""} onChange={maj("formeJuridique")} /></div>
              <div className="champ"><label>RCCM</label><input value={form.rccm || ""} onChange={maj("rccm")} /></div>
              <div className="champ"><label>Siège</label><input value={form.siege || ""} onChange={maj("siege")} /></div>
              <div className="champ"><label>Téléphone</label><input value={form.telephone || ""} onChange={maj("telephone")} /></div>
              <div className="champ"><label>E-mail</label><input value={form.email || ""} onChange={maj("email")} /></div>
            </div>
          </Carte>

          <Carte titre="Modèle économique" sous="Ces valeurs alimentent le calcul de chaque commande">
            <div className="grille-2">
              <div className="champ"><label>Commission appliquée (FCFA/kg)</label>
                <input type="number" value={form.commissionParKg} onChange={maj("commissionParKg")} /></div>
              <div className="champ"><label>Tarif transport (FCFA/kg)</label>
                <input type="number" value={form.tarifTransportParKg} onChange={maj("tarifTransportParKg")} /></div>
              <div className="champ"><label>Commission minimale</label>
                <input type="number" value={form.commissionMin} onChange={maj("commissionMin")} /></div>
              <div className="champ"><label>Commission maximale</label>
                <input type="number" value={form.commissionMax} onChange={maj("commissionMax")} /></div>
              <div className="champ"><label>Objectif mensuel (kg)</label>
                <input type="number" value={form.objectifMensuelKg} onChange={maj("objectifMensuelKg")} /></div>
              <div className="champ"><label>Objectif revenu mensuel (FCFA)</label>
                <input type="number" value={form.objectifRevenuMensuel} onChange={maj("objectifRevenuMensuel")} /></div>
            </div>
            <div className="aide">Rappel business plan : commission de 10 à 25 FCFA/kg, objectif de 50 tonnes/mois pour 750 000 à 1 500 000 FCFA de revenus.</div>
          </Carte>
        </div>

        <Carte titre="Besoin de financement au démarrage">
          <div className="grille-2">
            <div className="champ"><label>Transport (avance / logistique)</label><input type="number" value={fin.transport || 0} onChange={majFin("transport")} /></div>
            <div className="champ"><label>Communication</label><input type="number" value={fin.communication || 0} onChange={majFin("communication")} /></div>
            <div className="champ"><label>Déplacements</label><input type="number" value={fin.deplacements || 0} onChange={majFin("deplacements")} /></div>
            <div className="champ"><label>Administratif</label><input type="number" value={fin.administratif || 0} onChange={majFin("administratif")} /></div>
          </div>
          <div className="total-ligne final">
            <span>Total</span>
            <span>{fcfa(Object.values(fin).reduce((s, v) => s + Number(v || 0), 0))}</span>
          </div>
        </Carte>

        <Bouton type="submit">Enregistrer les paramètres</Bouton>
      </form>
    </div>
  );
}

/* ---------------- Journal ---------------- */

function JournalAdmin({ journal }) {
  return (
    <Carte titre="Journal d'activité" sous="60 dernières opérations enregistrées" serre>
      <Tableau
        cle="id"
        colonnes={[{ titre: "Date" }, { titre: "Acteur" }, { titre: "Action" }, { titre: "Détail" }]}
        lignes={journal}
        vide="Aucune activité enregistrée."
        rendu={(j) => (
          <>
            <td>{dateHeure(j.date)}</td>
            <td className="cellule-titre">{j.acteur}</td>
            <td><Badge statut="neutre" texte={j.action.replace(/_/g, " ")} /></td>
            <td>{j.details}</td>
          </>
        )}
      />
    </Carte>
  );
}

/* ---------------- Conteneur admin ---------------- */

function EspaceAdmin({ page, utilisateur, referentiel, rafraichirReferentiel, onNaviguer, setCompteurs }) {
  const [stats, setStats] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [offres, setOffres] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [journal, setJournal] = useState([]);
  const [parametres, setParametres] = useState(referentiel.parametres);
  const [message, setMessage] = useState(null);

  const recharger = useCallback(() => {
    Api.get("/stats").then(setStats).catch(() => {});
    Api.get("/commandes").then(setCommandes).catch(() => {});
    Api.get("/offres").then(setOffres).catch(() => {});
    Api.get("/utilisateurs").then(setUtilisateurs).catch(() => {});
    Api.get("/transporteurs").then(setTransporteurs).catch(() => {});
    Api.get("/journal").then(setJournal).catch(() => {});
    Api.get("/parametres").then(setParametres).catch(() => {});
  }, []);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { setMessage(null); }, [page]);
  useEffect(() => {
    if (!stats) return;
    setCompteurs({
      commandes: stats.kpi.commandesAtraiter,
      planteurs: stats.kpi.planteursAValider,
    });
  }, [stats, setCompteurs]);

  if (page === "commandes") return <CommandesAdmin commandes={commandes} transporteurs={transporteurs} parametres={parametres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "offres") return <OffresAdmin offres={offres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "logistique") return <LogistiqueAdmin commandes={commandes} transporteurs={transporteurs} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "planteurs") return <ReseauAdmin role="planteur" utilisateurs={utilisateurs} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "acheteurs") return <ReseauAdmin role="acheteur" utilisateurs={utilisateurs} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "finances") return <FinancesAdmin stats={stats} commandes={commandes} parametres={parametres} />;
  if (page === "pilotage") return <PilotageAdmin stats={stats} parametres={parametres} />;
  if (page === "contrats") return <ContratsAdmin parametres={parametres} />;
  if (page === "journal") return <JournalAdmin journal={journal} />;
  if (page === "parametres") return <ParametresAdmin parametres={parametres} rafraichirReferentiel={rafraichirReferentiel} message={message} setMessage={setMessage} />;
  return <TdbAdmin stats={stats} commandes={commandes} journal={journal} onNaviguer={onNaviguer} />;
}
