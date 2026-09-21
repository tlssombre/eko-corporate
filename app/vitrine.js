/* =========================================================
   Eko Corporate — site vitrine public
   ========================================================= */

function EnteteSite({ page, setPage, onConnexion, utilisateur, onTableauDeBord }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setMenuOuvert(false); }, [page]);

  const aller = (cle) => setPage(cle);

  return (
    <header className={"site-entete" + (scrolled ? " scrolled" : "") + (menuOuvert ? " menu-ouvert" : "")}>
      <div className="marque" onClick={() => aller("accueil")} style={{ cursor: "pointer" }}>
        <img src="/assets/logo.jpg" alt="Eko Corporate" />
        <div>
          <div className="nom">Eko Corporate</div>
          <div className="bl">Agro · Logistique · Côte d'Ivoire</div>
        </div>
      </div>
      <button className="burger-site" onClick={() => setMenuOuvert(!menuOuvert)}
        aria-label="Ouvrir le menu" aria-expanded={menuOuvert}>
        <span /><span /><span />
      </button>
      <nav className={"site-nav" + (menuOuvert ? " ouvert" : "")}>
        {[
          ["accueil", "Accueil"],

          ["marche", "Marché du jour"],
          ["services", "Services"],
          ["contrats", "Contrats"],
          ["contact", "Contact"],
        ].map(([cle, libelle]) => (
          <button key={cle} className={page === cle ? "actif" : ""} onClick={() => aller(cle)}>{libelle}</button>
        ))}
        {utilisateur ? (
          <Bouton onClick={onTableauDeBord}>Mon espace</Bouton>
        ) : (
          <Bouton onClick={onConnexion}>Connexion</Bouton>
        )}
      </nav>
    </header>
  );
}

function PiedSite({ parametres, setPage }) {
  return (
    <footer className="site-pied">
      <div className="grille">
        <div>
          <div className="logo-chip"><img src="/assets/logo.jpg" alt="Eko Corporate" /></div>
          <p>
            Facilitateur sécurisé du commerce agricole : nous connectons directement les planteurs
            et les acheteurs, et organisons le transport des produits jusqu'à la livraison.
          </p>
        </div>
        <div>
          <h5>Navigation</h5>
          <ul>
            {[["projet", "Le projet"], ["marche", "Marché du jour"], ["services", "Services"], ["contrats", "Contrats types"]].map(([c, l]) => (
              <li key={c}><a href="#" onClick={(e) => { e.preventDefault(); setPage(c); }} style={{ color: "inherit" }}>{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Contact</h5>
          <ul>
            <li>{parametres.siege || "Abidjan, Côte d'Ivoire"}</li>
            <li>{parametres.telephone}</li>
            <li>{parametres.email}</li>
            <li>RCCM : {parametres.rccm}</li>
          </ul>
        </div>
      </div>
      <div className="bas">
        © {new Date().getFullYear()} {parametres.nomEntreprise || "Eko Corporate"} {parametres.formeJuridique || "SARL"} — Mise en relation agricole & logistique
      </div>
    </footer>
  );
}

function Accueil({ setPage, onConnexion, offres }) {
  const stockTotal = offres.reduce((s, o) => s + o.quantiteRestante, 0);
  const produits = new Set(offres.map((o) => o.produit)).size;
  return (
    <div>
      <section className="heros">
        <img src="/assets/logo.jpg" alt="Eko Corporate" />
        <div className="signature">Qualité · Confiance · Performance</div>
        <h1>Le lien direct entre le planteur<br />et son acheteur</h1>
        <p>
          {BP.resume.objet} Notre zone de démarrage : {BP.resume.zone}.
        </p>
        <div className="actions">
          <Bouton onClick={onConnexion}>Créer mon compte</Bouton>
          <Bouton variante="fantome" onClick={() => setPage("marche")}>Voir les offres du jour</Bouton>
        </div>
      </section>

      <div className="bande-chiffres">
        <div className="grille">
          <Reveal><div><div className="v"><Compteur valeur={produits} /></div><div className="l">Produits référencés</div></div></Reveal>
          <Reveal retard={90}><div><div className="v"><Compteur valeur={stockTotal} format={tonnes} /></div><div className="l">Disponible aujourd'hui</div></div></Reveal>
          <Reveal retard={180}><div><div className="v">10–25 F</div><div className="l">Commission / kg</div></div></Reveal>
          <Reveal retard={270}><div><div className="v">50 t</div><div className="l">Objectif mensuel</div></div></Reveal>
        </div>
      </div>

      <section className="section">
        <div className="filet" />
        <h2>Un marché déséquilibré</h2>
        <p className="intro">
          En Côte d'Ivoire, la production est abondante mais mal organisée. Les planteurs peinent à
          atteindre les marchés urbains pendant que les usines cherchent des fournisseurs fiables.
        </p>
        <div className="trio">
          <Reveal><div className="tuile">
            <div className="puce">🌱</div>
            <h4>Côté planteurs</h4>
            <ul className="liste-verte">{BP.problematique.planteurs.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div></Reveal>
          <Reveal retard={100}><div className="tuile">
            <div className="puce">🏭</div>
            <h4>Côté acheteurs</h4>
            <ul className="liste-verte">
              <li>Manque de fournisseurs fiables</li>
              <li>Volumes irréguliers et qualité variable</li>
              <li>Approvisionnement dépendant d'intermédiaires informels</li>
            </ul>
          </div></Reveal>
          <Reveal retard={200}><div className="tuile">
            <div className="puce">⚖️</div>
            <h4>Notre réponse</h4>
            <ul className="liste-verte">{BP.solution.axes.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div></Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="filet" />
        <h2>Comment ça marche</h2>
        <p className="intro">Cinq étapes, du champ jusqu'au paiement, tracées dans la plateforme.</p>
        <div className="etapes">
          {[
            ["Collecte des offres", "Le planteur publie son produit, sa quantité et son prix."],
            ["Négociation", "L'acheteur consulte le marché et passe une demande."],
            ["Validation commande", "Le planteur accepte : la commande est contractualisée."],
            ["Transport", "Eko affecte un transporteur partenaire et suit la livraison."],
            ["Paiement", "Règlement sécurisé, commission déduite, reçu émis."],
          ].map(([titre, txt], i) => (
            <Reveal retard={i * 90} key={i}><div className="etape">
              <div className="n">{i + 1}</div>
              <h5>{titre}</h5>
              <p>{txt}</p>
            </div></Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

function PageProjet({ parametres }) {
  const totalFinancement = BP.financement.reduce((s, f) => s + f.montant, 0);
  return (
    <section className="section">
      <div className="filet" />
      <h2>Le projet Eko Corporate</h2>
      <p className="intro">
        L'intégralité du business plan, structurée section par section : problématique, modèle
        économique, organisation, financement, risques et plan de lancement.
      </p>

      <Accordeon titre="1. Résumé exécutif" ouvertParDefaut>
        <p>{BP.resume.objet}</p>
        <h5>Objectifs</h5>
        <ul className="liste-verte">{BP.resume.objectifs.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Sources de revenus</h5>
        <ul className="liste-verte">{BP.resume.revenus.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p><strong>Zone de démarrage :</strong> {BP.resume.zone}</p>
      </Accordeon>

      <Accordeon titre="2. Problématique">
        <h5>Pour les planteurs</h5>
        <ul>{BP.problematique.planteurs.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Pour les acheteurs</h5>
        <ul>{BP.problematique.acheteurs.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p><strong>{BP.problematique.conclusion}</strong></p>
      </Accordeon>

      <Accordeon titre="3. Solution et positionnement">
        <ul className="liste-verte">{BP.solution.axes.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p><strong>Positionnement :</strong> « {BP.solution.positionnement} »</p>
      </Accordeon>

      <Accordeon titre="4. Description de l'entreprise">
        <h5>Activités principales</h5>
        <ul>{BP.entreprise.activites.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Statut juridique conseillé</h5>
        <p>{BP.entreprise.statut}</p>
        <h5>Clients</h5>
        <ul>{BP.entreprise.clients.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Accordeon>

      <Accordeon titre="5. Analyse de marché">
        <h5>Demande</h5>
        <ul>{BP.marche.demande.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Offre</h5>
        <ul>{BP.marche.offre.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p><strong>Opportunité :</strong> {BP.marche.opportunite}</p>
        <h5>Concurrence</h5>
        <ul>{BP.marche.concurrence.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Faiblesse des concurrents</h5>
        <ul>{BP.marche.faiblesses.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Accordeon>

      <Accordeon titre="6. Modèle économique" ouvertParDefaut>
        <div className="kpis k3" style={{ marginBottom: 18 }}>
          <Kpi libelle="Commission" valeur={BP.modele.commission} detail="Prélevée uniquement en cas de vente effective" />
          <Kpi libelle="Revenu de départ" valeur="500k – 800k FCFA" detail="Par mois, sur 20 tonnes" />
          <Kpi libelle="Revenu visé" valeur="750k – 1,5M FCFA" detail="Par mois, sur 50 tonnes" />
        </div>
        <table className="tableau-simple">
          <thead><tr><th>Hypothèse</th><th>Valeur</th></tr></thead>
          <tbody>
            <tr><td>Volume mensuel</td><td>{BP.modele.exemple.volume}</td></tr>
            <tr><td>Commission moyenne</td><td>{BP.modele.exemple.commissionMoyenne}</td></tr>
            <tr><td>Revenu de commission</td><td>{fcfa(BP.modele.exemple.revenuCommission)}</td></tr>
            <tr><td>Revenu de transport</td><td>{BP.modele.exemple.revenuTransport}</td></tr>
            <tr><td><strong>Total possible (début)</strong></td><td><strong>{BP.modele.exemple.total}</strong></td></tr>
          </tbody>
        </table>
      </Accordeon>

      <Accordeon titre="7. Stratégie opérationnelle">
        <h5>Approvisionnement</h5>
        <ul>{BP.operations.approvisionnement.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Vente</h5>
        <ul>{BP.operations.vente.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Logistique</h5>
        <ul>{BP.operations.logistique.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Process</h5>
        <ol>{BP.operations.process.map((x, i) => <li key={i} style={{ color: "var(--texte-doux)", lineHeight: 1.8 }}>{x}</li>)}</ol>
      </Accordeon>

      <Accordeon titre="8. Stratégie marketing">
        <h5>Terrain</h5>
        <ul>{BP.marketing.terrain.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Digital</h5>
        <ul>{BP.marketing.digital.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h5>Réseau</h5>
        <ul>{BP.marketing.reseau.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Accordeon>

      <Accordeon titre="9. Organisation">
        <table className="tableau-simple">
          <thead><tr><th>Poste</th><th>Mission</th></tr></thead>
          <tbody>{BP.organisation.map((o, i) => <tr key={i}><td><strong>{o.poste}</strong></td><td>{o.mission}</td></tr>)}</tbody>
        </table>
      </Accordeon>

      <Accordeon titre="10. Aspect juridique (Côte d'Ivoire)">
        <ul className="liste-verte">{BP.juridique.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p>Forme retenue : <strong>{parametres.formeJuridique || "SARL"}</strong> — RCCM {parametres.rccm}, siège {parametres.siege}.</p>
      </Accordeon>

      <Accordeon titre="11. Besoin de financement">
        <table className="tableau-simple">
          <thead><tr><th>Poste</th><th>Montant</th></tr></thead>
          <tbody>
            {BP.financement.map((f, i) => <tr key={i}><td>{f.poste}</td><td>{fcfa(f.montant)}</td></tr>)}
            <tr><td><strong>Total au démarrage</strong></td><td><strong>≈ {fcfa(totalFinancement)}</strong></td></tr>
          </tbody>
        </table>
      </Accordeon>

      <Accordeon titre="12. Prévisions à 6 mois">
        <p><strong>Objectif :</strong> {BP.previsions.objectif}</p>
        <p><strong>Revenus estimés :</strong> {BP.previsions.revenus}</p>
      </Accordeon>

      <Accordeon titre="13. Risques et parades">
        <table className="tableau-simple">
          <thead><tr><th>Risque</th><th>Solution mise en place</th></tr></thead>
          <tbody>{BP.risques.map((r, i) => <tr key={i}><td><strong>{r.risque}</strong></td><td>{r.solution}</td></tr>)}</tbody>
        </table>
      </Accordeon>

      <Accordeon titre="14. Plan de lancement">
        <div className="etapes" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {BP.lancement.map((l, i) => (
            <div className="etape" key={i}><div className="n">{i + 1}</div><h5>{l.mois}</h5><p>{l.actions}</p></div>
          ))}
        </div>
      </Accordeon>

      <div className="tuile" style={{ marginTop: 22 }}>
        <h4>Conclusion</h4>
        <p>{BP.conclusion}</p>
      </div>
    </section>
  );
}

function PageMarche({ offres, onConnexion }) {
  const [produit, setProduit] = useState("");
  const [recherche, setRecherche] = useState("");
  const produits = useMemo(() => [...new Set(offres.map((o) => o.produit))].sort(), [offres]);
  const liste = useMemo(() => {
    let l = offres.filter((o) => o.statut === "disponible");
    if (produit) l = l.filter((o) => o.produit === produit);
    return filtrerTexte(l, recherche, ["produit", "localite", "planteurNom"]);
  }, [offres, produit, recherche]);

  return (
    <section className="section">
      <div className="filet" />
      <h2>Marché du jour</h2>
      <p className="intro">
        Les lots publiés par les planteurs du réseau. Créez un compte acheteur pour passer commande :
        la quantité est réservée dès l'acceptation du planteur.
      </p>
      <div className="outils">
        <input placeholder="Rechercher un produit, une localité…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select value={produit} onChange={(e) => setProduit(e.target.value)}>
          <option value="">Tous les produits</option>
          {produits.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <Bouton onClick={onConnexion}>Passer commande</Bouton>
      </div>
      <Carte serre>
        <Tableau
          cle="id"
          colonnes={[{ titre: "Produit" }, { titre: "Planteur" }, { titre: "Localité" },
            { titre: "Disponible", num: true }, { titre: "Prix / kg", num: true }, { titre: "Valeur du lot", num: true }]}
          lignes={liste}
          vide="Aucune offre disponible pour le moment."
          rendu={(o) => (
            <>
              <td><div className="cellule-titre">{o.produit}</div><div className="cellule-sous">{o.qualite}</div></td>
              <td>{o.planteurNom} {o.planteurVerifie && <Badge statut="disponible" texte="Vérifié" />}</td>
              <td>{o.localite || "—"}</td>
              <td className="num">{kg(o.quantiteRestante)}</td>
              <td className="num">{nombre(o.prix)} F</td>
              <td className="num">{fcfa(o.quantiteRestante * o.prix)}</td>
            </>
          )}
        />
      </Carte>
    </section>
  );
}

function PageServices({ parametres }) {
  return (
    <section className="section">
      <div className="filet" />
      <h2>Nos services</h2>
      <p className="intro">Deux métiers complémentaires : l'intermédiation commerciale et l'organisation logistique.</p>
      <div className="trio">
        <Reveal><div className="tuile">
          <div className="puce">🤝</div>
          <h4>Intermédiation</h4>
          <p>Recherche d'acheteurs fiables, négociation des conditions de vente, contractualisation et suivi de la transaction. Commission de {parametres.commissionMin}–{parametres.commissionMax} FCFA/kg, due uniquement en cas de vente effective.</p>
        </div></Reveal>
        <Reveal retard={100}><div className="tuile">
          <div className="puce">🚛</div>
          <h4>Logistique</h4>
          <p>Partenariats avec des transporteurs référencés, affectation du véhicule adapté au volume, bon de livraison et suivi jusqu'à la réception. Tarif indicatif : {parametres.tarifTransportParKg} FCFA/kg.</p>
        </div></Reveal>
        <Reveal retard={200}><div className="tuile">
          <div className="puce">🛡️</div>
          <h4>Sécurisation</h4>
          <p>Contrats types planteur et acheteur, traçabilité de chaque étape, contrôle qualité au départ, réclamation à la livraison et reçu de paiement pour le planteur.</p>
        </div></Reveal>
      </div>

      <h2 style={{ marginTop: 40 }}>Pour qui ?</h2>
      <div className="trio" style={{ marginTop: 18 }}>
        <Reveal><div className="tuile">
          <h4>Planteurs</h4>
          <ul className="liste-verte">
            <li>Publier ses lots et fixer son prix</li>
            <li>Accéder aux acheteurs urbains sans pisteur</li>
            <li>Suivre ses paiements et ses reçus</li>
          </ul>
        </div></Reveal>
        <Reveal retard={100}><div className="tuile">
          <h4>Usines & grossistes</h4>
          <ul className="liste-verte">
            <li>Un approvisionnement régulier et tracé</li>
            <li>Des producteurs sélectionnés</li>
            <li>Livraison organisée et facturée</li>
          </ul>
        </div></Reveal>
        <Reveal retard={200}><div className="tuile">
          <h4>Transporteurs</h4>
          <ul className="liste-verte">
            <li>Des courses régulières sur vos zones</li>
            <li>Chargements groupés et planifiés</li>
            <li>Paiement à la livraison confirmée</li>
          </ul>
        </div></Reveal>
      </div>
    </section>
  );
}

function PageContrats({ parametres }) {
  const [apercu, setApercu] = useState(null);
  return (
    <section className="section">
      <div className="filet" />
      <h2>Contrats types</h2>
      <p className="intro">
        Les deux modèles de contrats du business plan, pré-remplis avec les informations de
        l'entreprise. Ils servent de base à chaque transaction sur la plateforme.
      </p>
      <div className="trio" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Reveal><div className="tuile">
          <div className="puce">📄</div>
          <h4>Contrat avec le planteur</h4>
          <p>Contrat de fourniture agricole et d'intermédiation : objet, produits, engagements, commission, transport, paiement, responsabilité, durée et litiges.</p>
          <div style={{ marginTop: 16 }}>
            <Bouton variante="secondaire" petit onClick={() => setApercu({ titre: "Contrat avec le planteur", texte: contratPlanteurType(parametres) })}>Lire le modèle</Bouton>
          </div>
        </div></Reveal>
        <Reveal retard={100}><div className="tuile">
          <div className="puce">📄</div>
          <h4>Contrat avec l'acheteur</h4>
          <p>Contrat d'approvisionnement agricole et logistique : produits, prix, paiement, livraison, commission, réclamations, responsabilité et juridiction.</p>
          <div style={{ marginTop: 16 }}>
            <Bouton variante="secondaire" petit onClick={() => setApercu({ titre: "Contrat avec l'acheteur", texte: contratAcheteurType(parametres) })}>Lire le modèle</Bouton>
          </div>
        </div></Reveal>
      </div>
      {apercu && (
        <Modale titre={apercu.titre} taille="large" onFermer={() => setApercu(null)}
          pied={<>
            <Bouton variante="fantome" onClick={() => window.print()}>Imprimer</Bouton>
            <Bouton onClick={() => setApercu(null)}>Fermer</Bouton>
          </>}>
          <pre className="doc">{apercu.texte}</pre>
        </Modale>
      )}
    </section>
  );
}

function PageContact({ parametres, onConnexion }) {
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ nom: "", telephone: "", profil: "planteur", texte: "" });
  const envoyer = (e) => {
    e.preventDefault();
    if (!form.nom || !form.telephone) {
      setMessage({ type: "erreur", texte: "Merci d'indiquer votre nom et votre téléphone." });
      return;
    }
    setMessage({ type: "ok", texte: "Message enregistré. L'équipe terrain vous rappelle sous 48 h au " + form.telephone + "." });
    setForm({ nom: "", telephone: "", profil: "planteur", texte: "" });
  };
  return (
    <section className="section">
      <div className="filet" />
      <h2>Nous contacter</h2>
      <p className="intro">Une question, un lot à écouler, un besoin d'approvisionnement ? Laissez-nous vos coordonnées.</p>
      <div className="duo">
        <Carte titre="Formulaire de contact">
          <Message message={message} />
          <form onSubmit={envoyer}>
            <div className="grille-2">
              <div className="champ">
                <label>Nom complet / société</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Kouassi Yao" />
              </div>
              <div className="champ">
                <label>Téléphone</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="07 00 00 00 00" />
              </div>
            </div>
            <div className="champ">
              <label>Vous êtes</label>
              <select value={form.profil} onChange={(e) => setForm({ ...form, profil: e.target.value })}>
                <option value="planteur">Planteur / coopérative</option>
                <option value="acheteur">Usine, grossiste, marché</option>
                <option value="transporteur">Transporteur</option>
              </select>
            </div>
            <div className="champ">
              <label>Votre message</label>
              <textarea value={form.texte} onChange={(e) => setForm({ ...form, texte: e.target.value })} placeholder="Produit, quantité, zone…" />
            </div>
            <Bouton type="submit">Envoyer</Bouton>
          </form>
        </Carte>
        <div>
          <Carte titre="Coordonnées">
            <p style={{ lineHeight: 1.9, color: "var(--texte-doux)", margin: 0 }}>
              <strong>{parametres.nomEntreprise} {parametres.formeJuridique}</strong><br />
              {parametres.siege}<br />
              RCCM : {parametres.rccm}<br />
              Téléphone : {parametres.telephone}<br />
              E-mail : {parametres.email}
            </p>
          </Carte>
          <Carte titre="Rejoindre le réseau">
            <p style={{ color: "var(--texte-doux)", lineHeight: 1.7 }}>
              Créez directement votre compte planteur ou acheteur pour publier vos lots ou consulter
              le marché en temps réel.
            </p>
            <Bouton bloc onClick={onConnexion}>Créer mon compte</Bouton>
          </Carte>
        </div>
      </div>
    </section>
  );
}

function SiteVitrine({ parametres, utilisateur, onConnexion, onTableauDeBord }) {
  const [page, setPage] = useState("accueil");
  const [offres, setOffres] = useState([]);
  const [progression, setProgression] = useState(0);

  useEffect(() => {
    Api.get("/offres?statut=disponible").then(setOffres).catch(() => setOffres([]));
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgression(total > 0 ? (h.scrollTop / total) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  return (
    <div>
      <div className="barre-progression" style={{ width: progression + "%" }} />
      <EnteteSite page={page} setPage={setPage} onConnexion={onConnexion}
        utilisateur={utilisateur} onTableauDeBord={onTableauDeBord} />
      {page === "accueil" && <Accueil setPage={setPage} onConnexion={onConnexion} offres={offres} />}
      {page === "projet" && <PageProjet parametres={parametres} />}
      {page === "marche" && <PageMarche offres={offres} onConnexion={onConnexion} />}
      {page === "services" && <PageServices parametres={parametres} />}
      {page === "contrats" && <PageContrats parametres={parametres} />}
      {page === "contact" && <PageContact parametres={parametres} onConnexion={onConnexion} />}
      <PiedSite parametres={parametres} setPage={setPage} />
    </div>
  );
}
