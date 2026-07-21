// api/ensure-spots-for-location.js
//
// Appelée automatiquement par l'app à chaque ouverture de l'onglet Carte, avec
// la position de l'utilisateur. Contrairement à refresh-city-spots.js (à
// déclencher manuellement ville par ville), celle-ci fonctionne n'importe où :
// - Calcule dans quelle "case" géographique (~5,5km) se trouve la position
// - Si cette case a déjà été synchronisée avec Google il y a moins de 30 jours,
//   ne fait rien (évite de payer Google à chaque visite)
// - Sinon, interroge Google Places pour cette case précise et enregistre les
//   résultats, tagués avec cette case
//
// Variables d'environnement requises (identiques à refresh-city-spots.js) :
//   GOOGLE_PLACES_API_KEY, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CELL_SIZE = 0.05; // ≈ 5,5 km de côté
const REFRESH_AFTER_DAYS = 30;

const CATEGORIES = [
  { includedType: 'veterinary_care', type: 'vet', species: 'both', emoji: '🩺', metricLabel: 'avis Google' },
  { includedType: 'park', type: 'park', species: 'both', emoji: '🌳', metricLabel: null },
  { includedType: 'pet_store', type: 'petshop', species: 'both', emoji: '🛍️', metricLabel: 'avis Google' },
  { includedType: 'pet_boarding_service', type: 'boarding', species: 'both', emoji: '🏠', metricLabel: 'avis Google' },
  // Pas de catégorie "pet_care" ici : trop large côté Google (remontait des
  // jardineries, animaleries générales, etc. classées comme "toiletteurs").
  // Cette catégorie reste donc réservée aux ajouts par la communauté, plus fiables.
];

// Enseignes de jardinerie/grande distribution que Google classe parfois par
// erreur comme animalerie ("pet_store"), alors qu'il ne s'agit pas de
// commerces spécialisés animaux — on les exclut par précaution.
const EXCLUDED_NAME_PATTERNS = [/gamm\s*vert/i, /jardiland/i, /truffaut/i, /botanic/i];

// Devine l'espèce visée par le nom de l'établissement lui-même (Google ne
// fournit aucune info structurée là-dessus). Reste "both" par défaut si le
// nom ne mentionne clairement ni l'un ni l'autre — mieux vaut sous-filtrer
// que d'exclure à tort un établissement généraliste.
function guessSpeciesFromName(name) {
  const catPattern = /\b(chat|chats|féline?|feline?|miaou)\b/i;
  const dogPattern = /\b(chien|chiens|canin|canine)\b/i;
  const isCat = catPattern.test(name);
  const isDog = dogPattern.test(name);
  if (isCat && !isDog) return 'cat';
  if (isDog && !isCat) return 'dog';
  return 'both';
}

function cellIdFor(lat, lng) {
  return `${Math.round(lat / CELL_SIZE)}_${Math.round(lng / CELL_SIZE)}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lng, city } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const cellId = cellIdFor(lat, lng);

    // A-t-on déjà synchronisé cette case récemment ?
    const { data: syncRow } = await supabase
      .from('spot_cells_sync')
      .select('*')
      .eq('cell_id', cellId)
      .maybeSingle();

    const isFresh = syncRow?.last_synced_at &&
      (Date.now() - new Date(syncRow.last_synced_at).getTime()) < REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000;

    if (isFresh) {
      return res.status(200).json({ cellId, refreshed: false, reason: 'already fresh' });
    }

    let upserted = 0;
    const errors = [];

    for (const cat of CATEGORIES) {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.userRatingCount,places.types',
        },
        body: JSON.stringify({
          includedTypes: [cat.includedType],
          maxResultCount: 20,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: 5000 },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        errors.push({ category: cat.type, error: data });
        continue;
      }

      // Filtre strict : Google renvoie parfois des résultats approchants
      // (ex. des pharmacies mélangées aux vétérinaires) même avec
      // includedTypes — on ne garde que ceux dont le type exact est présent.
      // On exclut aussi les grandes surfaces connues pour être mal classées.
      const places = (data.places || [])
        .filter(p => (p.types || []).includes(cat.includedType))
        .filter(p => !EXCLUDED_NAME_PATTERNS.some(pattern => pattern.test(p.displayName?.text || '')));

      for (const place of places) {
        const name = place.displayName?.text || 'Sans nom';
        const row = {
          cell_id: cellId,
          city: city || null, // simple étiquette d'affichage, optionnelle
          name,
          type: cat.type,
          species: cat.species === 'both' ? guessSpeciesFromName(name) : cat.species,
          emoji: cat.emoji,
          lat: place.location?.latitude,
          lng: place.location?.longitude,
          address: place.formattedAddress || null,
          metric_label: cat.metricLabel,
          metric_value: place.userRatingCount || null,
          open: true,
          source: 'google_places',
          google_place_id: place.id,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('spots').upsert(row, { onConflict: 'google_place_id' });
        if (error) errors.push({ place: row.name, error: error.message });
        else upserted++;
      }
    }

    // On ne marque la case comme "à jour" que si la synchronisation a
    // vraiment réussi au moins partiellement — sinon on veut pouvoir
    // réessayer au prochain chargement plutôt que de rester bloqué 30 jours
    // sur un échec.
    if (upserted > 0) {
      await supabase.from('spot_cells_sync').upsert({
        cell_id: cellId,
        cell_lat: lat,
        cell_lng: lng,
        last_synced_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({ cellId, refreshed: true, upserted, errors: errors.length ? errors : undefined });
  } catch (err) {
    console.error('ensure-spots-for-location error:', err);
    return res.status(500).json({ error: err.message });
  }
};
