/* =========================================================
   Eko Corporate — espace Planteur
   ========================================================= */

/** Visionneuse de document (contrat, facture, bon de livraison, reçu) — partagée. */
function ModaleDocument({ titre, texte, onFermer }) {
  const telecharger = () => {
    const blob = new Blob([texte], { type: "text/plain;charset=utf-8" });
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = titre.replace(/[^\w\-]+/g, "_") + ".txt";
    lien.click();
    URL.revokeObjectURL(lien.href);
  };
  return (
    <Modale titre={titre} taille="large" onFermer={onFermer}
      pied={<>
        <Bouton variante="fantome" onClick={telecharger}>Télécharger</Bouton>
        <Bouton variante="secondaire" onClick={() => window.print()}>Imprimer</Bouton>
        <Bouton onClick={onFermer}>Fermer</Bouton>
      </>}>
      <pre className="doc">{texte}</pre>
    </Modale>
  );
}

/** Suivi d'une commande sous forme de chronologie — partagé. */
function ChronologieCommande({ commande }) {
  return (
    <ul className="chrono">
      {commande.historique.map((h, i) => (
        <li key={i}>
          <strong>{LIBELLES_STATUT[h.statut] || h.statut}</strong>
          <div className="quand">{dateHeure(h.date)} — par {h.par}</div>
        </li>
      ))}
    </ul>
  );
}

function RecapCommande({ c }) {
  return (
    <div className="recap">
      <div><span>Référence</span><strong>{c.reference}</strong></div>
      <div><span>Produit</span><strong>{c.produit}</strong></div>
      <div><span>Quantité</span><strong>{kg(c.quantite)}</strong></div>
      <div><span>Prix unitaire</span><strong>{nombre(c.prixKg)} FCFA/kg</strong></div>
      <div><span>Planteur</span><strong>{c.planteurNom}</strong></div>
      <div><span>Acheteur</span><strong>{c.acheteurNom}</strong></div>
      <div><span>Lieu de livraison</span><strong>{c.lieuLivraison}</strong></div>
      <div><span>Transporteur</span><strong>{c.transporteurNom || "à désigner"}</strong></div>
    </div>
  );
}

/* ---------------- Tableau de bord planteur ---------------- */

function TdbPlanteur({ stats, commandes, offres, onNaviguer }) {
  if (!stats) return <Vide texte="Chargement…" />;
  const k = stats.kpi;
  const aTraiter = commandes.filter((c) => c.statut === "en_attente");
  return (
    <div>
      <div className="kpis">
        <Kpi libelle="Revenu net encaissé" valeur={fcfa(k.revenuNet)} detail={`Commission versée : ${fcfa(k.commissionVersee)}`} />
        <Kpi libelle="Volume vendu" valeur={kg(k.volumeVenduKg)} detail={`Prix moyen : ${nombre(k.prixMoyenKg)} FCFA/kg`} />
        <Kpi libelle="Stock en ligne" valeur={kg(k.stockKg)} detail={`${k.offresActives} offre(s) active(s)`} />
        <Kpi libelle="À encaisser" valeur={fcfa(k.aEncaisser)} alerte={k.aEncaisser > 0} detail={`${k.encours} commande(s) en cours`} />
      </div>

      {aTraiter.length > 0 && (
        <div className="msg info">
          {aTraiter.length} demande(s) d'achat en attente de votre validation — répondez rapidement pour ne pas perdre la vente.
        </div>
      )}

      <div className="duo">
        <Carte titre="Volumes vendus" sous="6 derniers mois">
          <GrapheColonnes donnees={stats.serie} cleValeur="volumeKg" format={nombre} />
        </Carte>
        <Carte titre="Répartition par produit">
          <GrapheAnneau donnees={stats.parProduit} />
        </Carte>
      </div>

      <Carte titre="Revenu net par mois" sous="Après déduction de la commission d'intermédiation">
        <GrapheCourbe donnees={stats.serie} cleValeur="montant" format={fcfa} />
      </Carte>

      <Carte titre="Demandes récentes" sous="Les 5 dernières commandes reçues"
        actions={<Bouton variante="fantome" petit onClick={() => onNaviguer("commandes")}>Tout voir</Bouton>} serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Produit" }, { titre: "Acheteur" }, { titre: "Quantité", num: true }, { titre: "Net planteur", num: true }, { titre: "Statut" }]}
          lignes={commandes.slice(0, 5)}
          vide="Aucune commande reçue pour l'instant."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.produit}</td>
              <td>{c.acheteurNom}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td className="num">{fcfa(c.netPlanteur)}</td>
              <td><Badge statut={c.statut} /></td>
            </>
          )}
        />
      </Carte>
    </div>
  );
}

/* ---------------- Mes offres ---------------- */

function OffresPlanteur({ offres, referentiel, parametres, recharger, message, setMessage }) {
  const [form, setForm] = useState({ produit: "", quantite: "", prix: "", qualite: "Standard marché", localite: "" });
  const [filtre, setFiltre] = useState("toutes");
  const [occupe, setOccupe] = useState(false);

  const publier = async (e) => {
    e.preventDefault();
    setOccupe(true);
    try {
      await Api.post("/offres", form);
      setForm({ produit: "", quantite: "", prix: "", qualite: "Standard marché", localite: form.localite });
      setMessage({ type: "ok", texte: "Offre publiée : elle est visible immédiatement par les acheteurs." });
      recharger();
    } catch (err) {
      setMessage({ type: "erreur", texte: err.message });
    } finally { setOccupe(false); }
  };

  const retirer = async (o) => {
    if (!window.confirm(`Retirer l'offre « ${o.produit} » du marché ?`)) return;
    try {
      await Api.supprimer("/offres/" + o.id);
      setMessage({ type: "ok", texte: "Offre retirée du marché." });
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const liste = filtre === "toutes" ? offres : offres.filter((o) => o.statut === filtre);
  const commission = Number(form.quantite || 0) * parametres.commissionParKg;
  const brut = Number(form.quantite || 0) * Number(form.prix || 0);

  return (
    <div>
      <Message message={message} />
      <div className="duo">
        <Carte titre="Publier une offre" sous="Votre lot est visible par tous les acheteurs du réseau">
          <form onSubmit={publier}>
            <div className="grille-2">
              <div className="champ">
                <label>Produit</label>
                <select value={form.produit} onChange={(e) => setForm({ ...form, produit: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {referentiel.produits.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="champ">
                <label>Quantité (kg)</label>
                <input type="number" min="1" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} placeholder="Ex : 5000" />
              </div>
              <div className="champ">
                <label>Prix souhaité (FCFA/kg)</label>
                <input type="number" min="1" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} placeholder="Ex : 300" />
              </div>
              <div className="champ">
                <label>Localité du lot</label>
                <input value={form.localite} onChange={(e) => setForm({ ...form, localite: e.target.value })} placeholder="Ex : Divo" />
              </div>
            </div>
            <div className="champ">
              <label>Qualité annoncée</label>
              <select value={form.qualite} onChange={(e) => setForm({ ...form, qualite: e.target.value })}>
                <option>Standard marché</option>
                <option>Premier choix</option>
                <option>Second choix</option>
                <option>Destiné à la transformation</option>
              </select>
            </div>

            {brut > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="total-ligne"><span>Valeur brute du lot</span><span>{fcfa(brut)}</span></div>
                <div className="total-ligne"><span>Commission Eko ({parametres.commissionParKg} FCFA/kg)</span><span>− {fcfa(commission)}</span></div>
                <div className="total-ligne final"><span>Net estimé pour vous</span><span>{fcfa(brut - commission)}</span></div>
              </div>
            )}

            <Bouton type="submit" bloc disabled={occupe}>Publier l'offre</Bouton>
          </form>
        </Carte>

        <Carte titre="Conseils de vente">
          <ul className="liste-verte">
            <li>Annoncez une quantité réellement disponible : la commande réserve votre stock.</li>
            <li>Un prix proche du marché urbain accélère la vente.</li>
            <li>La commission ({parametres.commissionMin} à {parametres.commissionMax} FCFA/kg) n'est due qu'en cas de vente effective.</li>
            <li>Préparez le lot avant la date de chargement pour éviter les pertes post-récolte.</li>
            <li>Un contrôle qualité au départ limite les réclamations à la livraison.</li>
          </ul>
        </Carte>
      </div>

      <Carte titre="Mes offres" serre
        actions={<Onglets valeur={filtre} onChange={setFiltre} valeurs={[
          { cle: "toutes", libelle: "Toutes", compteur: offres.length },
          { cle: "disponible", libelle: "Disponibles", compteur: offres.filter((o) => o.statut === "disponible").length },
          { cle: "epuisee", libelle: "Épuisées", compteur: offres.filter((o) => o.statut === "epuisee").length },
          { cle: "retiree", libelle: "Retirées", compteur: offres.filter((o) => o.statut === "retiree").length },
        ]} />}>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Produit" }, { titre: "Publiée le" }, { titre: "Quantité", num: true },
            { titre: "Restant", num: true }, { titre: "Prix/kg", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Vous n'avez pas encore publié d'offre."
          rendu={(o) => (
            <>
              <td><div className="cellule-titre">{o.produit}</div><div className="cellule-sous">{o.qualite} · {o.localite || "—"}</div></td>
              <td>{dateCourte(o.dateCreation)}</td>
              <td className="num">{kg(o.quantite)}</td>
              <td className="num">{kg(o.quantiteRestante)}</td>
              <td className="num">{nombre(o.prix)} F</td>
              <td><Badge statut={o.statut} /></td>
              <td>
                <div className="actions-ligne">
                  {o.statut === "disponible" && <Bouton variante="danger" petit onClick={() => retirer(o)}>Retirer</Bouton>}
                </div>
              </td>
            </>
          )}
        />
      </Carte>
    </div>
  );
}

/* ---------------- Commandes reçues ---------------- */

function CommandesPlanteur({ commandes, parametres, recharger, message, setMessage }) {
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [detail, setDetail] = useState(null);
  const [apercu, setApercu] = useState(null);

  const agir = async (c, action, libelle) => {
    try {
      await Api.post(`/commandes/${c.id}/${action}`);
      setMessage({ type: "ok", texte: `Commande ${c.reference} : ${libelle}.` });
      setDetail(null);
      recharger();
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const liste = useMemo(() => {
    let l = filtre === "tous" ? commandes : commandes.filter((c) => c.statut === filtre);
    return filtrerTexte(l, recherche, ["reference", "produit", "acheteurNom"]);
  }, [commandes, filtre, recherche]);

  const compter = (s) => commandes.filter((c) => c.statut === s).length;

  return (
    <div>
      <Message message={message} />
      <div className="outils">
        <input placeholder="Rechercher une référence, un produit, un acheteur…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ minWidth: 300 }} />
        <Onglets valeur={filtre} onChange={setFiltre} valeurs={[
          { cle: "tous", libelle: "Toutes", compteur: commandes.length },
          { cle: "en_attente", libelle: "À valider", compteur: compter("en_attente") },
          { cle: "acceptee", libelle: "Acceptées", compteur: compter("acceptee") },
          { cle: "en_transport", libelle: "En transport", compteur: compter("en_transport") },
          { cle: "livree", libelle: "Livrées", compteur: compter("livree") },
          { cle: "payee", libelle: "Payées", compteur: compter("payee") },
        ]} />
        <Bouton variante="fantome" petit onClick={() => exporterCsv("commandes_planteur.csv",
          ["Référence", "Date", "Produit", "Acheteur", "Quantité (kg)", "Prix/kg", "Net planteur", "Statut"],
          liste.map((c) => [c.reference, dateCourte(c.dateCreation), c.produit, c.acheteurNom, c.quantite, c.prixKg, c.netPlanteur, LIBELLES_STATUT[c.statut]]))}>
          Exporter CSV
        </Bouton>
      </div>

      <Carte serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Référence" }, { titre: "Date" }, { titre: "Produit" }, { titre: "Acheteur" },
            { titre: "Qté", num: true }, { titre: "Commission", num: true }, { titre: "Net planteur", num: true }, { titre: "Statut" }, { titre: "" }]}
          lignes={liste}
          vide="Aucune commande ne correspond à ce filtre."
          rendu={(c) => (
            <>
              <td className="cellule-titre">{c.reference}</td>
              <td>{dateCourte(c.dateCreation)}</td>
              <td>{c.produit}</td>
              <td>{c.acheteurNom}</td>
              <td className="num">{kg(c.quantite)}</td>
              <td className="num">− {fcfa(c.commission)}</td>
              <td className="num"><strong>{fcfa(c.netPlanteur)}</strong></td>
              <td><Badge statut={c.statut} /></td>
              <td>
                <div className="actions-ligne">
                  {c.statut === "en_attente" && (
                    <>
                      <Bouton petit onClick={() => agir(c, "accepter", "vente acceptée")}>Accepter</Bouton>
                      <Bouton variante="danger" petit onClick={() => agir(c, "refuser", "demande refusée")}>Refuser</Bouton>
                    </>
                  )}
                  <Bouton variante="fantome" petit onClick={() => setDetail(c)}>Détail</Bouton>
                </div>
              </td>
            </>
          )}
        />
      </Carte>

      {detail && (
        <Modale titre={"Commande " + detail.reference} taille="large" onFermer={() => setDetail(null)}
          pied={<>
            <Bouton variante="fantome" onClick={() => setApercu({ titre: "Contrat " + detail.reference, texte: contratTransaction(detail, parametres) })}>Voir le contrat</Bouton>
            {detail.statut === "payee" && (
              <Bouton variante="fantome" onClick={() => setApercu({ titre: "Reçu " + detail.reference, texte: recuPlanteur(detail, parametres) })}>Reçu de paiement</Bouton>
            )}
            {detail.statut === "en_attente" && <Bouton onClick={() => agir(detail, "accepter", "vente acceptée")}>Accepter la vente</Bouton>}
          </>}>
          <RecapCommande c={detail} />
          <div className="total-ligne"><span>Montant des produits</span><span>{fcfa(detail.montantProduits)}</span></div>
          <div className="total-ligne"><span>Commission d'intermédiation</span><span>− {fcfa(detail.commission)}</span></div>
          <div className="total-ligne final"><span>Net qui vous revient</span><span>{fcfa(detail.netPlanteur)}</span></div>
          <h4 style={{ marginTop: 22, marginBottom: 12, color: "var(--vert-nuit)" }}>Suivi</h4>
          <ChronologieCommande commande={detail} />
        </Modale>
      )}

      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Paiements planteur ---------------- */

function PaiementsPlanteur({ commandes, parametres }) {
  const [apercu, setApercu] = useState(null);
  const regles = commandes.filter((c) => c.statut === "payee");
  const attente = commandes.filter((c) => c.statut === "livree");
  const total = regles.reduce((s, c) => s + c.netPlanteur, 0);
  const commissions = regles.reduce((s, c) => s + c.commission, 0);

  return (
    <div>
      <div className="kpis k3">
        <Kpi libelle="Total encaissé" valeur={fcfa(total)} detail={`${regles.length} paiement(s) reçu(s)`} />
        <Kpi libelle="En attente de règlement" valeur={fcfa(attente.reduce((s, c) => s + c.netPlanteur, 0))} alerte={attente.length > 0} detail={`${attente.length} livraison(s) à régler`} />
        <Kpi libelle="Commissions versées" valeur={fcfa(commissions)} detail="Rémunération de l'intermédiation" />
      </div>

      <Carte titre="Paiements reçus" serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Date" }, { titre: "Référence" }, { titre: "Produit" }, { titre: "Acheteur" },
            { titre: "Brut", num: true }, { titre: "Commission", num: true }, { titre: "Net reçu", num: true }, { titre: "Mode" }, { titre: "" }]}
          lignes={regles}
          vide="Aucun paiement enregistré pour le moment."
          rendu={(c) => (
            <>
              <td>{dateCourte(c.datePaiement)}</td>
              <td className="cellule-titre">{c.reference}</td>
              <td>{c.produit}</td>
              <td>{c.acheteurNom}</td>
              <td className="num">{fcfa(c.montantProduits)}</td>
              <td className="num">− {fcfa(c.commission)}</td>
              <td className="num"><strong>{fcfa(c.netPlanteur)}</strong></td>
              <td>{MODES_PAIEMENT[c.modePaiement]}</td>
              <td><div className="actions-ligne">
                <Bouton variante="fantome" petit onClick={() => setApercu({ titre: "Reçu " + c.reference, texte: recuPlanteur(c, parametres) })}>Reçu</Bouton>
              </div></td>
            </>
          )}
        />
      </Carte>

      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Profil (partagé planteur / acheteur) ---------------- */

function PageProfil({ utilisateur, setUtilisateur, parametres }) {
  const [form, setForm] = useState({
    nom: utilisateur.nom, localite: utilisateur.localite || "",
    societe: utilisateur.societe || "", email: utilisateur.email || "",
  });
  const [mdp, setMdp] = useState({ ancienMotDePasse: "", nouveauMotDePasse: "" });
  const [message, setMessage] = useState(null);
  const [apercu, setApercu] = useState(null);

  const enregistrer = async (e) => {
    e.preventDefault();
    try {
      const u = await Api.put("/auth/profil", form);
      setUtilisateur(u);
      setMessage({ type: "ok", texte: "Profil mis à jour." });
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const changerMdp = async (e) => {
    e.preventDefault();
    try {
      await Api.put("/auth/profil", mdp);
      setMdp({ ancienMotDePasse: "", nouveauMotDePasse: "" });
      setMessage({ type: "ok", texte: "Mot de passe modifié." });
    } catch (err) { setMessage({ type: "erreur", texte: err.message }); }
  };

  const contrat = utilisateur.role === "acheteur" ? contratAcheteurType(parametres) : contratPlanteurType(parametres);

  return (
    <div>
      <Message message={message} />
      <div className="duo">
        <Carte titre="Mes informations">
          <form onSubmit={enregistrer}>
            <div className="champ"><label>Nom</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            {utilisateur.role === "acheteur" && (
              <div className="champ"><label>Société</label>
                <input value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })} /></div>
            )}
            <div className="grille-2">
              <div className="champ"><label>Localité</label>
                <input value={form.localite} onChange={(e) => setForm({ ...form, localite: e.target.value })} /></div>
              <div className="champ"><label>E-mail</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="champ"><label>Téléphone (identifiant)</label>
              <input value={utilisateur.telephone} disabled /></div>
            <Bouton type="submit">Enregistrer</Bouton>
          </form>
        </Carte>

        <div>
          <Carte titre="Statut du compte">
            <div className="total-ligne"><span>Rôle</span><span><Badge statut="disponible" texte={utilisateur.role === "planteur" ? "Planteur" : utilisateur.role === "acheteur" ? "Acheteur" : "Administrateur"} /></span></div>
            <div className="total-ligne"><span>Vérification</span><span><Badge statut={utilisateur.verifie ? "disponible" : "en_attente"} texte={utilisateur.verifie ? "Vérifié" : "En cours"} /></span></div>
            <div className="total-ligne"><span>Membre depuis</span><span>{dateLongue(utilisateur.dateCreation)}</span></div>
            <div style={{ marginTop: 16 }}>
              <Bouton variante="secondaire" bloc onClick={() => setApercu({ titre: "Mon contrat type", texte: contrat })}>Consulter mon contrat type</Bouton>
            </div>
          </Carte>

          <Carte titre="Changer de mot de passe">
            <form onSubmit={changerMdp}>
              <div className="champ"><label>Mot de passe actuel</label>
                <input type="password" value={mdp.ancienMotDePasse} onChange={(e) => setMdp({ ...mdp, ancienMotDePasse: e.target.value })} /></div>
              <div className="champ"><label>Nouveau mot de passe</label>
                <input type="password" value={mdp.nouveauMotDePasse} onChange={(e) => setMdp({ ...mdp, nouveauMotDePasse: e.target.value })} /></div>
              <Bouton variante="secondaire" type="submit">Modifier</Bouton>
            </form>
          </Carte>
        </div>
      </div>
      {apercu && <ModaleDocument titre={apercu.titre} texte={apercu.texte} onFermer={() => setApercu(null)} />}
    </div>
  );
}

/* ---------------- Conteneur planteur ---------------- */

function EspacePlanteur({ page, utilisateur, setUtilisateur, referentiel, onNaviguer }) {
  const [offres, setOffres] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const parametres = referentiel.parametres;

  const recharger = useCallback(() => {
    Api.get("/offres?mien=1").then(setOffres).catch(() => {});
    Api.get("/commandes").then(setCommandes).catch(() => {});
    Api.get("/stats/moi").then(setStats).catch(() => {});
  }, []);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { setMessage(null); }, [page]);

  if (page === "offres") return <OffresPlanteur offres={offres} referentiel={referentiel} parametres={parametres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "commandes") return <CommandesPlanteur commandes={commandes} parametres={parametres} recharger={recharger} message={message} setMessage={setMessage} />;
  if (page === "paiements") return <PaiementsPlanteur commandes={commandes} parametres={parametres} />;
  if (page === "profil") return <PageProfil utilisateur={utilisateur} setUtilisateur={setUtilisateur} parametres={parametres} />;
  return <TdbPlanteur stats={stats} commandes={commandes} offres={offres} onNaviguer={onNaviguer} />;
}
