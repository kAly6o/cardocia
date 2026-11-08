import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ----------------------- CONFIGURATION -----------------------
const TARGET_COLLECTION = "sv"; // "" pour TOUTES
const LIMIT = -1; // -1 = toutes
const OUT_FILE = path.join('public', 'data', 'card-hashes.json');
const TCGDEX_API = "https://api.tcgdex.net/v2/fr";

// ----------------------- CALCUL D'HASH PERCEPTUEL -----------------------
function calcHash(imageBuffer) {
  return sharp(imageBuffer)
    .resize(8, 8)
    .greyscale()
    .raw()
    .toBuffer()
    .then(data => {
      let hash = BigInt(0);
      for (let i = 0; i < data.length; i++) {
        hash = (hash << BigInt(1)) | BigInt(data[i] > 128 ? 1 : 0);
      }
      return hash.toString(16);
    })
    .catch(err => {
      console.error('calcHash error:', err.message);
      return null;
    });
}

// ----------------------- ACCÈS AUX CARTES TCGDEX -----------------------
async function fetchTcgdex(path) {
  const res = await fetch(`${TCGDEX_API}${path}`);
  if (!res.ok) throw new Error(`TCGdex HTTP ${res.status} (${path})`);
  return res.json();
}

async function getCardUrls() {
  const cards = [];
  try {
    const series = await fetchTcgdex(`/series/${TARGET_COLLECTION}`);
    const sets = series.sets || [];

    for (const set of sets) {
      const setDetail = await fetchTcgdex(`/sets/${set.id}`);
      const setCards = setDetail.cards || [];

      for (const card of setCards) {
        if (!card.image) continue;
        cards.push({
          id: card.id,
          name: card.name,
          image_url: `${card.image}/high.webp`,
          set_code: set.id,
          localId: card.localId || '',
        });
      }
    }
  } catch {
    // Ignorer les erreurs, retourner ce qu'on a
  }
  return cards;
}

// ----------------------- GÉNÉRATION -----------------------
async function main() {
  console.log(`⏃ Génération hashs pour: ${TARGET_COLLECTION === "" ? "TOUTES" : TARGET_COLLECTION}, LIMIT: ${LIMIT === -1 ? "TOUTES" : LIMIT}`);

  const urls = await getCardUrls();
  console.log(`📦 ${urls.length} cartes trouvées dans l'API TCGdex`);

  const database = [];

  for (let i = 0; i < urls.length; i++) {
    const { id, image_url, set_code, name } = urls[i];
    try {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      const imgBuffer = await imgRes.arrayBuffer();
      const hash = await calcHash(Buffer.from(imgBuffer));
      if (hash) {
        database.push({
          id,
          name,
          set: set_code || "inconnu",
          number: "?/?",
          hash,
          image_url,
        });
      }
    } catch (err) {
      console.error(`Erreur carte ${i} (${name}):`, err.message);
    }

    if (i % 50 === 0) process.stdout.write(`\r⏃ Progress: ${i}/${urls.length}`);
  }

  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(database, null, 2));
  console.log(`\n✅ Base prête: ${database.length} cartes ${TARGET_COLLECTION === "" ? "de toutes collections" : `de ${TARGET_COLLECTION}`}`);
  console.log(`📁 Fichier: ${OUT_FILE}`);
}

main().catch(err => console.error("Erreur:", err));
