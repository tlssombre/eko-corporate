const crypto = require("crypto");

function hacher(motDePasse, sel) {
  return crypto.pbkdf2Sync(motDePasse, sel, 50000, 32, "sha256").toString("hex");
}
function creerMotDePasse(motDePasse) {
  const sel = crypto.randomBytes(12).toString("hex");
  return { sel, hash: hacher(motDePasse, sel) };
}
function verifierMotDePasse(motDePasse, sel, hash) {
  if (!sel || !hash) return false;
  return hacher(motDePasse, sel) === hash;
}

module.exports = { creerMotDePasse, verifierMotDePasse };
