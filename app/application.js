/* =========================================================
   Eko Corporate — racine de l'application
   ========================================================= */

const MENUS = {
  admin: [
    { groupe: "Pilotage" },
    { cle: "tableau", ico: "▦", libelle: "Tableau de bord", titre: "Tableau de bord", fil: "Vue d'ensemble de l'activité" },
    { cle: "pilotage", ico: "◎", libelle: "Business plan", titre: "Pilotage stratégique", fil: "Objectifs du business plan et réalisé" },
    { groupe: "Commerce" },
    { cle: "commandes", ico: "▤", libelle: "Commandes", titre: "Commandes", fil: "Cycle complet, de la demande au paiement", compteur: "commandes" },
    { cle: "offres", ico: "❖", libelle: "Offres du marché", titre: "Offres du marché", fil: "Lots publiés par les planteurs" },
    { cle: "logistique", ico: "⛟", libelle: "Logistique", titre: "Logistique & transport", fil: "Plan de chargement et transporteurs partenaires" },
    { groupe: "Réseau" },
    { cle: "planteurs", ico: "🌱", libelle: "Planteurs", titre: "Planteurs", fil: "Fournisseurs du réseau", compteur: "planteurs" },
    { cle: "acheteurs", ico: "🏭", libelle: "Acheteurs", titre: "Acheteurs", fil: "Usines, grossistes et marchés urbains" },
    { groupe: "Gestion" },
    { cle: "finances", ico: "₣", libelle: "Finances", titre: "Finances", fil: "Commissions, transport et reversements" },
    { cle: "contrats", ico: "✎", libelle: "Contrats", titre: "Contrats & juridique", fil: "Modèles contractuels et cadre légal" },
    { cle: "journal", ico: "≡", libelle: "Journal", titre: "Journal d'activité", fil: "Traçabilité des opérations" },
    { cle: "parametres", ico: "⚙", libelle: "Paramètres", titre: "Paramètres", fil: "Identité, commission, objectifs" },
  ],
  planteur: [
    { groupe: "Mon activité" },
    { cle: "tableau", ico: "▦", libelle: "Tableau de bord", titre: "Tableau de bord", fil: "Vos ventes en un coup d'œil" },
    { cle: "offres", ico: "❖", libelle: "Mes offres", titre: "Mes offres", fil: "Publier et gérer vos lots" },
    { cle: "commandes", ico: "▤", libelle: "Demandes d'achat", titre: "Demandes d'achat", fil: "Valider vos ventes et suivre les livraisons" },
    { groupe: "Finances" },
    { cle: "paiements", ico: "₣", libelle: "Mes paiements", titre: "Mes paiements", fil: "Encaissements et reçus" },
    { groupe: "Compte" },
    { cle: "profil", ico: "◔", libelle: "Mon profil", titre: "Mon profil", fil: "Informations et contrat type" },
  ],
  acheteur: [
    { groupe: "Approvisionnement" },
    { cle: "tableau", ico: "▦", libelle: "Tableau de bord", titre: "Tableau de bord", fil: "Vos achats en un coup d'œil" },
    { cle: "marche", ico: "❖", libelle: "Marché", titre: "Marché du jour", fil: "Lots disponibles et commande directe" },
    { cle: "commandes", ico: "▤", libelle: "Mes commandes", titre: "Mes commandes", fil: "Suivi de vos demandes d'achat" },
    { cle: "livraisons", ico: "⛟", libelle: "Livraisons", titre: "Livraisons", fil: "Acheminement et réception" },
    { groupe: "Finances" },
    { cle: "factures", ico: "₣", libelle: "Factures", titre: "Factures", fil: "Documents et règlements" },
    { groupe: "Compte" },
    { cle: "profil", ico: "◔", libelle: "Mon profil", titre: "Mon profil", fil: "Informations et contrat type" },
  ],
};

const LIBELLE_ROLE = { admin: "Administration", planteur: "Espace planteur", acheteur: "Espace acheteur" };

function BackOffice({ utilisateur, setUtilisateur, referentiel, rafraichirReferentiel, onDeconnexion, onVitrine }) {
  const menu = MENUS[utilisateur.role] || MENUS.planteur;
  const [page, setPage] = useState("tableau");
  const [ouvert, setOuvert] = useState(false);
  const [compteurs, setCompteurs] = useState({});

  const entree = menu.find((m) => m.cle === page) || menu.find((m) => m.cle);
  const naviguer = (cle) => { setPage(cle); setOuvert(false); window.scrollTo(0, 0); };

  return (
    <div className="appli">
      <aside className={"barre-laterale" + (ouvert ? " ouverte" : "")}>
        <div className="marque">
          <img src="/assets/logo.jpg" alt="Eko Corporate" />
          <div>
            <div className="nom">Eko Corporate</div>
            <div className="role">{LIBELLE_ROLE[utilisateur.role]}</div>
          </div>
        </div>

        <nav className="menu">
          {menu.map((m, i) =>
            m.groupe ? (
              <div className="groupe" key={"g" + i}>{m.groupe}</div>
            ) : (
              <button key={m.cle} className={page === m.cle ? "actif" : ""} onClick={() => naviguer(m.cle)}>
                <span className="ico">{m.ico}</span>
                {m.libelle}
                {m.compteur && compteurs[m.compteur] > 0 && <span className="pastille">{compteurs[m.compteur]}</span>}
              </button>
            )
          )}
          <div className="groupe">Site</div>
          <button onClick={onVitrine}><span className="ico">⌂</span>Retour au site</button>
          <button onClick={onDeconnexion}><span className="ico">⏻</span>Déconnexion</button>
        </nav>

        <div className="pied-laterale">
          <div className="util">{utilisateur.nom}</div>
          <div>{utilisateur.telephone}</div>
        </div>
      </aside>

      <div className={"voile" + (ouvert ? " visible" : "")} onClick={() => setOuvert(false)} />

      <div className="zone">
        <header className="barre-haute">
          <button className="burger" onClick={() => setOuvert(!ouvert)} aria-label="Menu">☰</button>
          <div>
            <div className="titre-page">{entree ? entree.titre : "Tableau de bord"}</div>
            <div className="fil">{entree ? entree.fil : ""}</div>
          </div>
          <div className="droite">
            <div className="puce-util">
              <div className="avatar">{initiales(utilisateur.nom)}</div>
              <div>
                <div className="nom">{utilisateur.nom}</div>
                <div className="role">{LIBELLE_ROLE[utilisateur.role]}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="contenu">
          {utilisateur.role === "admin" && (
            <EspaceAdmin page={page} utilisateur={utilisateur} referentiel={referentiel}
              rafraichirReferentiel={rafraichirReferentiel} onNaviguer={naviguer} setCompteurs={setCompteurs} />
          )}
          {utilisateur.role === "planteur" && (
            <EspacePlanteur page={page} utilisateur={utilisateur} setUtilisateur={setUtilisateur}
              referentiel={referentiel} onNaviguer={naviguer} />
          )}
          {utilisateur.role === "acheteur" && (
            <EspaceAcheteur page={page} utilisateur={utilisateur} setUtilisateur={setUtilisateur}
              referentiel={referentiel} onNaviguer={naviguer} />
          )}
        </main>
      </div>
    </div>
  );
}

function Application() {
  const [vue, setVue] = useState("vitrine"); // vitrine | authentification | espace
  const [utilisateur, setUtilisateur] = useState(null);
  const [referentiel, setReferentiel] = useState(null);

  const chargerReferentiel = useCallback(() => {
    Api.get("/referentiel").then(setReferentiel).catch(() => {});
  }, []);

  useEffect(() => {
    chargerReferentiel();
    if (Api.token) {
      Api.get("/auth/moi")
        .then((u) => { setUtilisateur(u); setVue("espace"); })
        .catch(() => Api.definirToken(null));
    }
  }, [chargerReferentiel]);

  const deconnexion = async () => {
    try { await Api.post("/auth/deconnexion"); } catch (e) { /* session déjà close */ }
    Api.definirToken(null);
    setUtilisateur(null);
    setVue("vitrine");
  };

  if (!referentiel) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <img src="/assets/logo.jpg" alt="Eko Corporate" style={{ height: 80, borderRadius: 14 }} />
        <div style={{ color: "var(--texte-doux)" }}>Chargement de la plateforme…</div>
      </div>
    );
  }

  if (vue === "authentification") {
    return (
      <PageAuthentification
        onRetour={() => setVue("vitrine")}
        onConnecte={(u) => { setUtilisateur(u); setVue("espace"); }}
      />
    );
  }

  if (vue === "espace" && utilisateur) {
    return (
      <BackOffice
        utilisateur={utilisateur}
        setUtilisateur={setUtilisateur}
        referentiel={referentiel}
        rafraichirReferentiel={chargerReferentiel}
        onDeconnexion={deconnexion}
        onVitrine={() => setVue("vitrine")}
      />
    );
  }

  return (
    <SiteVitrine
      parametres={referentiel.parametres}
      utilisateur={utilisateur}
      onConnexion={() => setVue("authentification")}
      onTableauDeBord={() => setVue("espace")}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Application />);
