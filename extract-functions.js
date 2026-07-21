// tests/extract-functions.js
//
// Extrait le CODE RÉEL de certaines fonctions pures depuis App.jsx (pas une
// copie qui pourrait se désynchroniser), pour pouvoir les tester isolément
// sans avoir besoin de React, du navigateur, ou d'une connexion réseau.
//
// Fonctionne par comptage d'accolades : trouve "function nomDeLaFonction("
// puis suit les accolades jusqu'à la fermeture correspondante.

const fs = require("fs");
const path = require("path");

function extractFunction(source, name) {
  const startPattern = new RegExp(`function\\s+${name}\\s*\\(`);
  const match = source.match(startPattern);
  if (!match) throw new Error(`Fonction "${name}" introuvable dans App.jsx — a-t-elle été renommée ?`);

  const startIdx = match.index;
  const braceStart = source.indexOf("{", startIdx);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) break; }
  }
  return source.slice(startIdx, i + 1);
}

function extractConst(source, name) {
  // Pour les constantes simples type "const X = <valeur>;" sur une ou plusieurs lignes.
  const startPattern = new RegExp(`const\\s+${name}\\s*=`);
  const match = source.match(startPattern);
  if (!match) throw new Error(`Constante "${name}" introuvable dans App.jsx — a-t-elle été renommée ?`);
  const startIdx = match.index;
  const semiIdx = source.indexOf(";", startIdx);
  return source.slice(startIdx, semiIdx + 1);
}

function loadPureFunctions() {
  const appPath = path.join(__dirname, "..", "App.jsx");
  const source = fs.readFileSync(appPath, "utf8");

  const code = [
    extractConst(source, "FRENCH_CITIES"),
    extractFunction(source, "distanceKm"),
    extractConst(source, "SPOT_CELL_SIZE"),
    extractFunction(source, "nearestCity"),
    extractFunction(source, "cellIdFor"),
    extractFunction(source, "neighborCellIds"),
    extractFunction(source, "parseGiftPrice"),
    extractFunction(source, "formatRelativeTime"),
  ].join("\n\n");

  const sandbox = {};
  const fn = new Function(
    "exports",
    code + `
    exports.distanceKm = distanceKm;
    exports.cellIdFor = cellIdFor;
    exports.neighborCellIds = neighborCellIds;
    exports.nearestCity = nearestCity;
    exports.parseGiftPrice = parseGiftPrice;
    exports.formatRelativeTime = formatRelativeTime;
    `
  );
  fn(sandbox);
  return sandbox;
}

module.exports = { loadPureFunctions, extractFunction, extractConst };
