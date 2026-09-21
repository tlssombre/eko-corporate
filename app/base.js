/* =========================================================
   Eko Corporate — socle applicatif
   Client API, formats, composants d'interface et graphiques
   ========================================================= */

const { useState, useEffect, useMemo, useCallback, useRef } = React;

const CLE_TOKEN = "eko_token";

/* ---------------- Client API ---------------- */

const Api = {
  token: localStorage.getItem(CLE_TOKEN) || null,
  definirToken(t) {
    this.token = t;
    if (t) localStorage.setItem(CLE_TOKEN, t);
    else localStorage.removeItem(CLE_TOKEN);
  },
  async appel(methode, chemin, corps) {
    const entetes = {};
    if (corps) entetes["Content-Type"] = "application/json";
    if (this.token) entetes["Authorization"] = "Bearer " + this.token;
    const res = await fetch("/api" + chemin, {
      method: methode,
      headers: entetes,
      body: corps ? JSON.stringify(corps) : undefined,
    });
    let donnees = null;
    try { donnees = await res.json(); } catch (e) { donnees = null; }
    if (!res.ok) {
      const err = new Error((donnees && donnees.erreur) || "Erreur réseau");
      err.statut = res.status;
      throw err;
    }
    return donnees;
  },
  get(c) { return this.appel("GET", c); },
  post(c, b) { return this.appel("POST", c, b || {}); },
  put(c, b) { return this.appel("PUT", c, b || {}); },
  patch(c, b) { return this.appel("PATCH", c, b || {}); },
  supprimer(c) { return this.appel("DELETE", c); },
};

/* ---------------- Formats ---------------- */

const fcfa = (n) => (Number(n) || 0).toLocaleString("fr-FR") + " FCFA";
const nombre = (n) => (Number(n) || 0).toLocaleString("fr-FR");
const kg = (n) => nombre(n) + " kg";
const tonnes = (n) => (Number(n) / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " t";
const dateCourte = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—");
const dateLongue = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");
const dateHeure = (d) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
const initiales = (nom) => (nom || "?").split(" ").filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();

const LIBELLES_STATUT = {
  disponible: "Disponible", epuisee: "Épuisée", retiree: "Retirée",
  en_attente: "En attente", acceptee: "Acceptée", refusee: "Refusée",
  en_transport: "En transport", livree: "Livrée", payee: "Payée", annulee: "Annulée",
  actif: "Actif", inactif: "Inactif",
};

const MODES_PAIEMENT = {
  mobile_money: "Mobile Money", especes: "Espèces", virement: "Virement bancaire", cheque: "Chèque",
};

/* ---------------- Composants de base ---------------- */

function Badge({ statut, texte }) {
  return <span className={"badge " + statut}>{texte || LIBELLES_STATUT[statut] || statut}</span>;
}

function Message({ message }) {
  if (!message) return null;
  return <div className={"msg " + message.type}>{message.texte}</div>;
}

function Bouton({ variante = "principal", petit, bloc, children, ...reste }) {
  const classes = ["btn", "btn-" + variante];
  if (petit) classes.push("btn-petit");
  if (bloc) classes.push("btn-bloc");
  return <button className={classes.join(" ")} {...reste}>{children}</button>;
}

function Carte({ titre, sous, actions, children, serre }) {
  return (
    <div className="carte">
      {(titre || actions) && (
        <div className="carte-entete">
          <div>
            {titre && <h3>{titre}</h3>}
            {sous && <div className="sous">{sous}</div>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
        </div>
      )}
      <div className={"carte-corps" + (serre ? " serre" : "")}>{children}</div>
    </div>
  );
}

function Kpi({ libelle, valeur, detail, progression, alerte }) {
  return (
    <div className={"kpi" + (alerte ? " alerte" : "")}>
      <div className="libelle">{libelle}</div>
      <div className="valeur">{valeur}</div>
      {detail && <div className="detail">{detail}</div>}
      {progression !== undefined && (
        <div className="jauge"><span style={{ width: Math.min(100, Math.max(0, progression)) + "%" }} /></div>
      )}
    </div>
  );
}

function Vide({ texte, action }) {
  return (
    <div className="vide">
      <div>{texte}</div>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

function Tableau({ colonnes, lignes, rendu, vide, cle }) {
  if (!lignes.length) return <Vide texte={vide || "Aucune donnée pour le moment."} />;
  return (
    <div className="table-enveloppe">
      <table>
        <thead>
          <tr>{colonnes.map((c, i) => <th key={i} className={c.num ? "num" : ""}>{c.titre}</th>)}</tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => <tr key={cle ? l[cle] : i}>{rendu(l, i)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Modale({ titre, taille, onFermer, pied, children }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFermer]);
  return (
    <div className="fond-modale" onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div className={"modale" + (taille === "large" ? " large" : "")}>
        <div className="modale-entete">
          <h3>{titre}</h3>
          <button className="fermer" onClick={onFermer} aria-label="Fermer">×</button>
        </div>
        <div className="modale-corps">{children}</div>
        {pied && <div className="modale-pied">{pied}</div>}
      </div>
    </div>
  );
}

function Accordeon({ titre, ouvertParDefaut, children }) {
  const [ouvert, setOuvert] = useState(!!ouvertParDefaut);
  return (
    <div className="accordeon">
      <button className="accordeon-titre" onClick={() => setOuvert(!ouvert)}>
        <span>{titre}</span><span className={"accordeon-icone" + (ouvert ? " ouvert" : "")}>+</span>
      </button>
      <div className={"accordeon-corps-enveloppe" + (ouvert ? " ouvert" : "")}>
        <div className="accordeon-corps">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Interactivité : révélation au scroll, compteurs ---------------- */

function useEnVue(options) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const obs = new IntersectionObserver(([entree]) => {
      if (entree.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, retard, className, comme: Comme = "div" }) {
  const [ref, visible] = useEnVue();
  return (
    <Comme ref={ref} className={"reveal" + (visible ? " visible" : "") + (className ? " " + className : "")}
      style={retard ? { transitionDelay: retard + "ms" } : undefined}>
      {children}
    </Comme>
  );
}

function Compteur({ valeur, duree = 1300, decimales = 0, format }) {
  const [ref, visible] = useEnVue();
  const [affiche, setAffiche] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const cible = Number(valeur) || 0;
    const debut = performance.now();
    let brut;
    const anime = (t) => {
      const p = Math.min(1, (t - debut) / duree);
      const accel = 1 - Math.pow(1 - p, 3);
      setAffiche(cible * accel);
      if (p < 1) brut = requestAnimationFrame(anime);
    };
    brut = requestAnimationFrame(anime);
    return () => cancelAnimationFrame(brut);
  }, [visible, valeur, duree]);
  const texte = format ? format(affiche) : affiche.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return <span ref={ref}>{texte}</span>;
}

function Onglets({ valeurs, valeur, onChange }) {
  return (
    <div className="onglets-filtre">
      {valeurs.map((v) => (
        <button key={v.cle} className={valeur === v.cle ? "actif" : ""} onClick={() => onChange(v.cle)}>
          {v.libelle}{v.compteur !== undefined ? ` (${v.compteur})` : ""}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Graphiques SVG (sans librairie) ---------------- */

function GrapheColonnes({ donnees, cleValeur = "volumeKg", format = nombre, couleur = "#1f7a3d", hauteur = 230 }) {
  const largeur = 620, margeG = 56, margeD = 12, margeH = 18, margeB = 34;
  const max = Math.max(1, ...donnees.map((d) => d[cleValeur]));
  const aireL = largeur - margeG - margeD;
  const aireH = hauteur - margeH - margeB;
  const pas = aireL / Math.max(1, donnees.length);
  const largeurBarre = Math.min(46, pas * 0.56);
  const paliers = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="graphe" viewBox={`0 0 ${largeur} ${hauteur}`} role="img">
      {paliers.map((p, i) => {
        const y = margeH + aireH - p * aireH;
        return (
          <g key={i}>
            <line x1={margeG} y1={y} x2={largeur - margeD} y2={y} stroke="#e6efe8" strokeWidth="1" />
            <text x={margeG - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#8aa093">
              {format(Math.round(max * p)).replace(" FCFA", "")}
            </text>
          </g>
        );
      })}
      {donnees.map((d, i) => {
        const h = (d[cleValeur] / max) * aireH;
        const x = margeG + i * pas + (pas - largeurBarre) / 2;
        const y = margeH + aireH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={largeurBarre} height={Math.max(2, h)} rx="5" fill={couleur} opacity={0.9}>
              <title>{d.libelle} : {format(d[cleValeur])}</title>
            </rect>
            <text x={x + largeurBarre / 2} y={hauteur - 12} textAnchor="middle" fontSize="11" fill="#5c7566">{d.libelle}</text>
          </g>
        );
      })}
    </svg>
  );
}

function GrapheCourbe({ donnees, cleValeur = "commission", format = fcfa, hauteur = 230 }) {
  const largeur = 620, margeG = 66, margeD = 14, margeH = 18, margeB = 34;
  const max = Math.max(1, ...donnees.map((d) => d[cleValeur]));
  const aireL = largeur - margeG - margeD;
  const aireH = hauteur - margeH - margeB;
  const pts = donnees.map((d, i) => {
    const x = margeG + (donnees.length === 1 ? aireL / 2 : (i * aireL) / (donnees.length - 1));
    const y = margeH + aireH - (d[cleValeur] / max) * aireH;
    return { x, y, d };
  });
  const chemin = pts.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" ");
  const aire = chemin + ` L ${pts[pts.length - 1].x} ${margeH + aireH} L ${pts[0].x} ${margeH + aireH} Z`;

  return (
    <svg className="graphe" viewBox={`0 0 ${largeur} ${hauteur}`} role="img">
      <defs>
        <linearGradient id="degradeAire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3fa35c" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#3fa35c" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((p, i) => {
        const y = margeH + aireH - p * aireH;
        return (
          <g key={i}>
            <line x1={margeG} y1={y} x2={largeur - margeD} y2={y} stroke="#e6efe8" />
            <text x={margeG - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#8aa093">{format(Math.round(max * p))}</text>
          </g>
        );
      })}
      <path d={aire} fill="url(#degradeAire)" />
      <path d={chemin} fill="none" stroke="#1f7a3d" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#1f7a3d" strokeWidth="2.5">
            <title>{p.d.libelle} : {format(p.d[cleValeur])}</title>
          </circle>
          <text x={p.x} y={hauteur - 12} textAnchor="middle" fontSize="11" fill="#5c7566">{p.d.libelle}</text>
        </g>
      ))}
    </svg>
  );
}

function GrapheAnneau({ donnees, cleValeur = "volumeKg", cleNom = "produit", format = kg }) {
  const palette = ["#145229", "#1f7a3d", "#3fa35c", "#6cbf85", "#9bd6ac", "#c2e5cd", "#c9922b", "#e0b45c"];
  const total = donnees.reduce((s, d) => s + d[cleValeur], 0) || 1;
  let angle = -Math.PI / 2;
  const R = 74, r = 46, cx = 100, cy = 100;
  const arcs = donnees.slice(0, 8).map((d, i) => {
    const part = d[cleValeur] / total;
    const a0 = angle, a1 = angle + part * Math.PI * 2;
    angle = a1;
    const grand = a1 - a0 > Math.PI ? 1 : 0;
    const chemin = [
      `M ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${grand} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}`,
      `L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`,
      `A ${r} ${r} 0 ${grand} 0 ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}`, "Z",
    ].join(" ");
    return { chemin, couleur: palette[i % palette.length], d, part };
  });

  if (!donnees.length) return <Vide texte="Pas encore de données." />;

  return (
    <div>
      <svg viewBox="0 0 200 200" className="graphe" style={{ maxWidth: 230, margin: "0 auto" }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.chemin} fill={a.couleur}>
            <title>{a.d[cleNom]} : {format(a.d[cleValeur])}</title>
          </path>
        ))}
        <text x="100" y="96" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0b3a20">{format(total)}</text>
        <text x="100" y="112" textAnchor="middle" fontSize="9" fill="#8aa093">TOTAL</text>
      </svg>
      <div className="legende" style={{ justifyContent: "center" }}>
        {arcs.map((a, i) => (
          <span key={i}>
            <i style={{ background: a.couleur }} />
            {a.d[cleNom]} · {Math.round(a.part * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

function BarresHorizontales({ donnees, cleNom, cleValeur, format = nombre }) {
  const max = Math.max(1, ...donnees.map((d) => d[cleValeur]));
  if (!donnees.length) return <Vide texte="Pas encore de données." />;
  return (
    <div>
      {donnees.map((d, i) => (
        <div className="ligne-barre" key={i}>
          <span className="etiquette">{d[cleNom]}</span>
          <span className="piste"><span style={{ width: (d[cleValeur] / max) * 100 + "%" }} /></span>
          <span className="valeur">{format(d[cleValeur])}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Utilitaires ---------------- */

function filtrerTexte(liste, terme, champs) {
  const t = (terme || "").trim().toLowerCase();
  if (!t) return liste;
  return liste.filter((o) => champs.some((c) => String(o[c] || "").toLowerCase().includes(t)));
}

function exporterCsv(nomFichier, colonnes, lignes) {
  const echapper = (v) => `"${String(v === undefined || v === null ? "" : v).replace(/"/g, '""')}"`;
  const contenu = [colonnes.map(echapper).join(";"), ...lignes.map((l) => l.map(echapper).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(lien.href);
}
