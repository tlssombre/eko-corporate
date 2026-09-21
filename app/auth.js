/* =========================================================
   Eko Corporate — connexion / inscription
   ========================================================= */

function PageAuthentification({ onConnecte, onRetour }) {
  const [mode, setMode] = useState("connexion");
  const [role, setRole] = useState("planteur");
  const [form, setForm] = useState({
    telephone: "", motDePasse: "", nom: "", localite: "", societe: "", email: "",
  });
  const [message, setMessage] = useState(null);
  const [msgId, setMsgId] = useState(0);
  const [occupe, setOccupe] = useState(false);
  const [mdpVisible, setMdpVisible] = useState(false);

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const remplirDemo = (tel, mdp) => {
    setMode("connexion");
    setForm({ ...form, telephone: tel, motDePasse: mdp });
    setMessage(null);
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setOccupe(true);
    setMessage(null);
    try {
      const donnees = mode === "connexion"
        ? await Api.post("/auth/connexion", { telephone: form.telephone, motDePasse: form.motDePasse })
        : await Api.post("/auth/inscription", {
            nom: form.nom, telephone: form.telephone, motDePasse: form.motDePasse,
            role, localite: form.localite, societe: form.societe, email: form.email,
          });
      Api.definirToken(donnees.token);
      onConnecte(donnees.utilisateur);
    } catch (err) {
      setMessage({ type: "erreur", texte: err.message });
      setMsgId((id) => id + 1);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="page-auth">
      <div className="vitre">
        <img src="/assets/logo.jpg" alt="Eko Corporate" />
        <h2>Le commerce agricole,<br />structuré et sécurisé.</h2>
        <p>
          Planteurs, usines, grossistes et marchés urbains sur une même plateforme : publication des
          lots, commandes contractualisées, transport organisé et paiement tracé.
        </p>
        <div className="stats-auth" style={{ marginTop: 30, display: "flex", gap: 26, flexWrap: "wrap" }}>
          <div><div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700 }}>10–25 F</div><div style={{ fontSize: 11.5, letterSpacing: 1, opacity: .75, textTransform: "uppercase" }}>Commission / kg</div></div>
          <div><div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700 }}>50 t</div><div style={{ fontSize: 11.5, letterSpacing: 1, opacity: .75, textTransform: "uppercase" }}>Objectif mensuel</div></div>
          <div><div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700 }}>Abidjan</div><div style={{ fontSize: 11.5, letterSpacing: 1, opacity: .75, textTransform: "uppercase" }}>Zone de départ</div></div>
        </div>
      </div>

      <div className="formulaire">
        <div className="boite">
          <h3>{mode === "connexion" ? "Connexion" : "Créer un compte"}</h3>
          <div className="sous">
            {mode === "connexion"
              ? "Accédez à votre espace planteur, acheteur ou administrateur."
              : "Quelques informations suffisent pour rejoindre le réseau."}
          </div>

          <Message key={msgId} message={message} />

          {mode === "inscription" && (
            <div className="bascule-role">
              <button className={role === "planteur" ? "actif" : ""} onClick={() => setRole("planteur")} type="button">🌱 Planteur</button>
              <button className={role === "acheteur" ? "actif" : ""} onClick={() => setRole("acheteur")} type="button">🏭 Acheteur</button>
            </div>
          )}

          <form onSubmit={soumettre}>
            {mode === "inscription" && (
              <div className="champ champ-anime">
                <label>{role === "acheteur" ? "Nom du responsable" : "Nom complet"}</label>
                <input value={form.nom} onChange={maj("nom")} placeholder={role === "acheteur" ? "Ex : Konan Yves" : "Ex : Kouassi Yao"} />
              </div>
            )}

            <div className="champ">
              <label>Téléphone</label>
              <input value={form.telephone} onChange={maj("telephone")} placeholder="07 00 00 00 00" autoComplete="username" />
            </div>

            <div className="champ">
              <label>Mot de passe</label>
              <div className="champ-mdp">
                <input type={mdpVisible ? "text" : "password"} value={form.motDePasse} onChange={maj("motDePasse")}
                  placeholder="••••••••" autoComplete={mode === "connexion" ? "current-password" : "new-password"} />
                <button type="button" className="bouton-oeil" onClick={() => setMdpVisible(!mdpVisible)}
                  aria-label={mdpVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {mdpVisible ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {mode === "inscription" && (
              <>
                {role === "acheteur" && (
                  <div className="champ champ-anime">
                    <label>Société</label>
                    <input value={form.societe} onChange={maj("societe")} placeholder="Ex : SITA Agro SARL" />
                  </div>
                )}
                <div className="grille-2 champ-anime">
                  <div className="champ">
                    <label>Localité</label>
                    <input value={form.localite} onChange={maj("localite")} placeholder={role === "planteur" ? "Ex : Divo" : "Ex : Yopougon"} />
                  </div>
                  <div className="champ">
                    <label>E-mail (facultatif)</label>
                    <input value={form.email} onChange={maj("email")} placeholder="nom@exemple.ci" />
                  </div>
                </div>
              </>
            )}

            <Bouton bloc type="submit" disabled={occupe}>
              {occupe && <span className="spinner" />}
              {occupe ? "Veuillez patienter…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </Bouton>
          </form>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13.5, color: "var(--texte-doux)" }}>
            {mode === "connexion" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            <button onClick={() => { setMode(mode === "connexion" ? "inscription" : "connexion"); setMessage(null); }}
              style={{ background: "none", border: "none", color: "var(--vert)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5 }}>
              {mode === "connexion" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>

          <div className="comptes-demo">
            <div style={{ marginBottom: 6 }}><b>Comptes de démonstration</b></div>
            <div>Admin — <button onClick={() => remplirDemo("0700000000", "admin123")}>0700000000 / admin123</button></div>
            <div>Planteur — <button onClick={() => remplirDemo("0701010101", "demo1234")}>0701010101 / demo1234</button></div>
            <div>Acheteur — <button onClick={() => remplirDemo("0705050505", "demo1234")}>0705050505 / demo1234</button></div>
          </div>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={onRetour} style={{ background: "none", border: "none", color: "var(--texte-faible)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              ← Retour au site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
