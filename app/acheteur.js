/* =========================================================
   Eko Corporate — espace Acheteur
   ========================================================= */

function TdbAcheteur({ stats, commandes, onNaviguer }) {
  if (!stats) return <Vide texte="Chargement…" />;
  const k = stats.kpi;
  return (
    <div>
      <div className="kpis">
        <Kpi libelle="Montant des achats" valeur={fcfa(k.montantAchats)} detail={`Dont transport : ${fcfa(k.fraisTransport)}`} />
        <Kpi libelle="Volume approvisionné" valeur={kg(k.volumeAchateKg)} detail={`Coût moyen : ${nombre(k.coutMoyenKg)} FCFA/kg`} />
        <Kpi libelle="Commandes en cours" valeur={k.enCours} detail={`${k.commandesTotal} commande(s) au total`} />
        <Kpi libelle="À régler" valeur={fcfa(k.aRegler)} alerte={k.aRegler > 0} detail="Livraisons réceptionnées non payées" />
      </div>

      <div className="duo">
        <Carte titre="Volumes approvisionnés" sous="6 derniers mois">
          <GrapheColonnes donnees={stats.serie} cleValeur="volumeKg" format={nombre} />
        </Carte>
        <Carte titre="Répartition par produit">
          <GrapheAnneau donnees={stats.parProduit} />
        </Carte>
      </div>

      <Carte titre="Dépenses mensuelles">
        <GrapheCourbe donnees={stats.serie} cleValeur="montant" format={fcfa} />
      </Carte>

      <Carte titre="Dernières commandes" serre
        actions={<Bouton variante="fantome" petit onClick={() => onNaviguer("commandes")}>Tout voir</Bouton>}>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Produit" }, { titre: "Planteur" }, { titre: "Qté", num: true }, { titre: "Total", num: true }, { titre: "Statut" }]}
          lignes={commandes.slice(0, 5)}
          vide="Aucune commande pour le moment."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.produit}</td>
              <td>{c.planteurNom}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td className="num">{fcfa(c.montantTotal)}</td>
              <td><Badge statut={c.statut} /></td>
            </>
          )}
        />
      </Carte>
    </div>
  );
}

/* ---------------- Marché ---------------- */

function MarcheAcheteur({ offres, parametres, recharger, message, setMessage }) {
  const [recherche, setRecherche] = useState("");
  const [produit, setProduit] = useState("");
  const [tri, setTri] = useState("recent");
  const [panier, setPanier] = useState(null);

  const produits = useMemo(() => [...new Set(offres.map((o) => o.produit))].sort(), [offres]);
  const liste = useMemo(() => {
    let l = offres.filter((o) => o.statut === "disponible");
    if (produit) l = l.filter((o) => o.produit === produit);
    l = filtrerTexte(l, recherche, ["produit", "localite", "planteurNom", "qualite"]);
    const copie = l.slice();
    if (tri === "prix") copie.sort((a, b) => a.prix - b.prix);
    if (tri === "quantite") copie.sort((a, b) => b.quantiteRestante - a.quantiteRestante);
    return copie;
  }, [offres, produit, recherche, tri]);

  return (
    <div>
      <Message message={message} />
      <div className="outils">
        <input placeholder="Rechercher un produit, un planteur, une localité…" value={recherche}
          onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 300 }} />
        <select value={produit} onChange={(e) => setProduit(e.target.value)}>
          <option value="">Tous les produits</option>
          {produits.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={tri} onChange={(e) => setTri(e.target.value)}>
          <option value="recent">Plus récentes</option>
          <option value="prix">Prix croissant</option>
          <option value="quantite">Quantité décroissante</option>
        </select>
      </div>

      <Carte titre={`${liste.length} lot(s) disponible(s)`} sous={`Transport Eko : ${parametres.tarifTransportParKg} FCFA/kg — commission incluse dans le prix affiché du service`} serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Produit" }, { titre: "Planteur" }, { titre: "Localité" }, { titre: "Disponible", num: true },
            { titre: "Prix/kg", num: true }, { titre: "Valeur du lot", num: true }, { titre: "" }]}
          lignes={liste}
          vide="Aucun lot ne correspond à votre recherche."
          rendu={(o) => (
            <>
              <td><div className="cellule-titre">{o.produit}</div><div className="cellule-sous">{o.qualite}</div></td>
              <td>{o.planteurNom} {o.planteurVerifie && <Badge statut="disponible" texte="Vérifié" />}</td>
              <td>{o.localite || "—"}</td>
              <td className="num">{kg(o.quantiteRestante)}</td>
              <td className="num">{nombre(o.prix)} F</td>
              <td className="num">{fcfa(o.quantiteRestante * o.prix)}</td>
              <td><div className="actions-ligne"><Bouton petit onClick={() => setPanier(o)}>Commander</Bouton></div></td>
            </>
          )}
        />
      </Carte>

      {panier && (
        <ModaleCommande offre={panier} parametres={parametres} onFermer={() => setPanier(null)}
          onValide={(ref) => {
            setPanier(null);
            setMessage({ type: "ok", texte: `Commande ${ref} envoyée au planteur. Vous serez notifié dès son acceptation.` });
            recharger();
          }}
          onErreur={(texte) => setMessage({ type: "erreur", texte })} />
      )}
    </div>
  );
}

function ModaleCommande({ offre, parametres, onFermer, onValide, onErreur }) {
  const [form, setForm] = useState({
    quantite: Math.min(1000, offre.quantiteRestante),
    lieuLivraison: "Abidjan", modePaiement: "mobile_money", transportParEko: true,
  });
  const [occupe, setOccupe] = useState(false);

  const q = Number(form.quantite) || 0;
  const produits = q * offre.prix;
  const transport = form.transportParEko ? q * parametres.tarifTransportParKg : 0;
  const total = produits + transport;

  const valider = async () => {
    setOccupe(true);
    try {
      const c = await Api.post("/commandes", { offreId: offre.id, ...form });
      onValide(c.reference);
    } catch (err) { onErreur(err.message); onFermer(); }
    finally { setOccupe(false); }
  };

  return (
    <Modale titre={`Commander ${offre.produit}`} onFermer={onFermer}
      pied={<>
        <Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
        <Bouton onClick={valider} disabled={occupe || q <= 0 || q > offre.quantiteRestante}>Envoyer la demande</Bouton>
      </>}>
      <div className="recap">
        <div><span>Planteur</span><strong>{offre.planteurNom}</strong></div>
        <div><span>Localité</span><strong>{offre.localite || "—"}</strong></div>
        <div><span>Disponible</span><strong>{kg(offre.quantiteRestante)}</strong></div>
        <div><span>Prix unitaire</span><strong>{nombre(offre.prix)} FCFA/kg</strong></div>
      </div>

      <div className="champ">
        <label>Quantité souhaitée (kg)</label>
        <input type="number" min="1" max={offre.quantiteRestante} value={form.quantite}
          onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
        {q > offre.quantiteRestante && <div className="aide" style={{ color: "var(--rouge-txt)" }}>Quantité supérieure au stock disponible.</div>}
      </div>

      <div className="grille-2">
        <div className="champ">
          <label>Lieu de livraison</label>
          <input value={form.lieuLivraison} onChange={(e) => setForm({ ...form, lieuLivraison: e.target.value })} />
        </div>
        <div className="champ">
          <label>Mode de paiement</label>
          <select value={form.modePaiement} onChange={(e) => setForm({ ...form, modePaiement: e.target.value })}>
            {Object.entries(MODES_PAIEMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="champ">
        <label>Transport</label>
        <select value={form.transportParEko ? "1" : "0"} onChange={(e) => setForm({ ...form, transportParEko: e.target.value === "1" })}>
          <option value="1">Organisé par Eko Corporate ({parametres.tarifTransportParKg} FCFA/kg)</option>
          <option value="0">J'organise moi-même l'enlèvement</option>
        </select>
      </div>

      <div className="total-ligne"><span>Produits ({kg(q)})</span><span>{fcfa(produits)}</span></div>
      <div className="total-ligne"><span>Transport</span><span>{transport ? fcfa(transport) : "à votre charge"}</span></div>
      <div className="total-ligne final"><span>Total à régler</span><span>{fcfa(total)}</span></div>
    </Modale>
  );
}

/* ---------------- Commandes acheteur ---------------- */

function CommandesAcheteur({ commandes, parametres, recharger, message, setMessage }) {
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [detail, setDetail] = useState(null);
  const [apercu, setApercu] = useState(null);

  const annuler = async (c) => {
    if (!window.confirm(`Annuler la commande ${c.reference} ?`)) return;
    try {
      await Api.post(`/commandes/${c.id}/annuler`);
      setMessage({ type: "ok", texte: `Commande ${c.reference} annulée.` });
      setDetail(null);
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const liste = useMemo(() => {
    let l = filtre === "tous" ? commandes : commandes.filter((c) => c.statut === filtre);
    return filtrerTexte(l, recherche, ["reference", "produit", "planteurNom"]);
  }, [commandes, filtre, recherche]);
  const compter = (s) => commandes.filter((c) => c.statut === s).length;

  return (
    <div>
      <Message message={message} />
      <div className="outils">
        <input placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 280 }} />
        <Onglets valeur={filtre} onChange={setFiltre} valeurs={[
          { cle: "tous", libelle: "Toutes", compteur: commandes.length },
          { cle: "en_attente", libelle: "En attente", compteur: compter("en_attente") },
          { cle: "acceptee", libelle: "Acceptées", compteur: compter("acceptee") },
          { cle: "en_transport", libelle: "En transport", compteur: compter("en_transport") },
          { cle: "livree", libelle: "Livrées", compteur: compter("livree") },
          { cle: "payee", libelle: "Payées", compteur: compter("payee") },
        ]} />
        <Bouton variante="fantome" petit onClick={() => exporterCsv("mes_commandes.csv",
          ["Référence", "Date", "Produit", "Planteur", "Quantité (kg)", "Prix/kg", "Transport", "Total", "Statut"],
          liste.map((c) => [c.reference, dateCourte(c.dateCreation), c.produit, c.planteurNom, c.quantite, c.prixKg, c.fraisTransport, c.montantTotal, LIBELLES_STATUT[c.statut]]))}>
          Exporter CSV
        </Bouton>
      </div>

      <Carte serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Date" }, { titre: "Produit" }, { titre: "Planteur" },
            { titre: "Qté", num: true }, { titre: "Transport", num: true }, { titre: "Total", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Aucune commande ne correspond à ce filtre."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{dateCourte(c.dateCreation)}</td>
              <td>{c.produit}</td>
              <td>{c.planteurNom}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td className="num">{fcfa(c.fraisTransport)}</td>
              <td className="num"><strong>{fcfa(c.montantTotal)}</strong></td>
              <td><Badge statut={c.statut} /></td>
              <td><div className="actions-ligne">
                {c.statut === "en_attente" && <Bouton variante="danger" petit onClick={() => annuler(c)}>Annuler</Bouton>}
                <Bouton variante="fantome" petit onClick={() => setDetail(c)}>Détail</Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>

      {detail && (
        <Modale titre={"Commande " + detail.reference} taille="large" onFermer={() => setDetail(null)}
          pied={<>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Contrat " + detail.reference, texte: contratTransaction(detail, parametres) })}>Contrat</Bouton>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Facture " + detail.reference, texte: facture(detail, parametres) })}>Facture</Bouton>
            {["en_transport", "livree", "payee"].includes(detail.statut) && (
              <Bouton variante="fantome" onClick={() => setApercu({ titre: "Bon de livraison " + detail.reference, texte: bonLivraison(detail, parametres) })}>Bon de livraison</Bouton>
            )}
          </>}>
          <RecapCommande c={detail} />
          <div className="total-ligne"><span>Produits</span><span>{fcfa(detail.montantProduits)}</span></div>
          <div className="total-ligne"><span>Transport</span><span>{fcfa(detail.fraisTransport)}</span></div>
          <div className="total-ligne final"><span>Total à régler</span><span>{fcfa(detail.montantTotal)}</span></div>
          <h4 style={{ marginTop: 22, marginBottom: 12, color: "var(--vert-nuit)" }}>Suivi</h4>
          <ChronologieCommande commande={detail} />
        </Modale>
      )}

      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Livraisons acheteur ---------------- */

function LivraisonsAcheteur({ commandes, parametres }) {
  const [apercu, setApercu] = useState(null);
  const suivies = commandes.filter((c) => ["acceptee", "en_transport", "livree", "payee"].includes(c.statut));
  return (
    <div>
      <div className="kpis k3">
        <Kpi libelle="En préparation" valeur={commandes.filter((c) => c.statut === "acceptee").length} detail="Commandes acceptées, chargement à venir" />
        <Kpi libelle="En route" valeur={commandes.filter((c) => c.statut === "en_transport").length} detail="Marchandises en cours d'acheminement" />
        <Kpi libelle="Réceptionnées" valeur={commandes.filter((c) => ["livree", "payee"].includes(c.statut)).length} detail="Livraisons terminées" />
      </div>

      <Carte titre="Suivi des livraisons" serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Produit" }, { titre: "Qté", num: true }, { titre: "Transporteur" },
            { titre: "Lieu" }, { titre: "Expédition" }, { titre: "Livraison" }, { titre: "Statut" }, { titre: "" }]}
          lignes={suivies}
          vide="Aucune livraison en cours."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.produit}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td>{c.transporteurNom || <span className="cellule-sous">à désigner</span>}</td>
              <td>{c.lieuLivraison}</td>
              <td>{dateCourte(c.dateExpedition)}</td>
              <td>{dateCourte(c.dateLivraison)}</td>
              <td><Badge statut={c.statut} /></td>
              <td><div className="actions-ligne">
                {["en_transport", "livree", "payee"].includes(c.statut) && (
                  <Bouton variante="fantome" petit onClick={() => setApercu({ titre: "Bon de livraison " + c.reference, texte: bonLivraison(c, parametres) })}>Bon</Bouton>
                )}
              </div></td>
            </>
          )}
        />
      </Carte>
      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Factures acheteur ---------------- */

function FacturesAcheteur({ commandes, parametres }) {
  const [apercu, setApercu] = useState(null);
  const facturables = commandes.filter((c) => ["livree", "payee"].includes(c.statut));
  const du = facturables.filter((c) => c.statut === "livree").reduce((s, c) => s + c.montantTotal, 0);
  const paye = facturables.filter((c) => c.statut === "payee").reduce((s, c) => s + c.montantTotal, 0);

  return (
    <div>
      <div className="kpis k3">
        <Kpi libelle="Total facturé" valeur={fcfa(du + paye)} detail={`${facturables.length} facture(s)`} />
        <Kpi libelle="Réglé" valeur={fcfa(paye)} detail="Paiements confirmés" />
        <Kpi libelle="Restant dû" valeur={fcfa(du)} alerte={du > 0} detail="Factures non réglées" />
      </div>

      <Carte titre="Mes factures" serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Facture" }, { titre: "Date" }, { titre: "Produit" }, { titre: "Produits", num: true },
            { titre: "Transport", num: true }, { titre: "Total", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={facturables}
          vide="Aucune facture émise pour le moment."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference.replace("CMD", "FAC")}</td>
              <td>{dateCourte(c.dateLivraison || c.dateCreation)}</td>
              <td>{c.produit}</td>
              <td className="num">{fcfa(c.montantProduits)}</td>
              <td className="num">{fcfa(c.fraisTransport)}</td>
              <td className="num"><strong>{fcfa(c.montantTotal)}</strong></td>
              <td><Badge statut={c.statut} texte={c.statut === "payee" ? "Payée" : "À régler"} /></td>
              <td><div className="actions-ligne">
                <Bouton variante="fantome" petit onClick={() => setApercu({ titre: "Facture " + c.reference, texte: facture(c, parametres) })}>Voir</Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>
      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Conteneur acheteur ---------------- */

function EspaceAcheteur({ page, utilisateur, setUtilisateur, referentiel, onNaviguer }) {
  const [offres, setOffres] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const parametres = referentiel.parametres;

  const recharger = useCallback(() => {
    Api.get("/offres?statut=disponible").then(setOffres).catch(() => {});
    Api.get("/commandes").then(setCommandes).catch(() => {});
    Api.get("/stats/moi").then(setStats).catch(() => {});
  }, []);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { setMessage(null); }, [page]);

  if (page === "marche") return <MarcheAcheteur offres={offres} parametres={parametres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "commandes") return <CommandesAcheteur commandes={commandes} parametres={parametres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "livraisons") return <LivraisonsAcheteur commandes={commandes} parametres={parametres} />;
  if (page === "factures") return <FacturesAcheteur commandes={commandes} parametres={parametres} />;
  if (page === "profil") return <PageProfil utilisateur={utilisateur} setUtilisateur={setUtilisateur} parametres={parametres} />;
  return <TdbAcheteur stats={stats} commandes={commandes} onNaviguer={onNaviguer} />;
}
