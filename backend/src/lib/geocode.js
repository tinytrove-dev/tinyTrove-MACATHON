// Turns a store address into { lat, lng, radius_m, address }, or null if it can't
// be placed. Tries Google first, then OpenStreetMap (Google needs billing enabled).
// radius_m comes from the size of the place found, so a shopping centre gets a
// bigger radius than a single shop.

const MIN_RADIUS_M = 250; // indoor GPS is often 50-150m off
const MAX_RADIUS_M = 600;

const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371e3 * Math.asin(Math.sqrt(a));
};

// Half the diagonal of the place's bounding box, kept within sensible limits
const radiusFromBounds = (south, west, north, east) => {
  const radius = distanceMetres(south, west, north, east) / 2;
  return Math.round(Math.min(Math.max(radius, MIN_RADIUS_M), MAX_RADIUS_M));
};

// "Shop 26/110 Wattletree Rd" -> "110 Wattletree Rd", "LG29, Melbourne Central" -> "Melbourne Central".
// Geocoders often can't place unit and level numbers.
const withoutUnit = (address) =>
  address.replace(/^[^,]*\//, "").replace(/^(shop|level|unit|lg)\s*[\w-]*,\s*/i, "").trim();

// "Chadstone Shopping Centre, 1341 Dandenong Rd, ..." -> "Chadstone Shopping Centre",
// when the address leads with a named place rather than a street number
const placeName = (address) => {
  const first = address.split(",")[0].trim();
  return /\d/.test(first) || first === address.trim() ? null : first;
};

async function geocodeWithGoogle(query) {
  // Read here, not at import, so it doesn't depend on .env being loaded first
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!mapsApiKey) return null;
  const response = await fetch(
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      encodeURIComponent(query) +
      "&key=" +
      mapsApiKey
  );
  const geo = await response.json();
  const result = geo.results?.[0];
  if (!result) {
    if (geo.status !== "ZERO_RESULTS") console.warn("Google geocoding failed:", geo.status, geo.error_message);
    return null;
  }

  const { northeast, southwest } = result.geometry.viewport;
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    radius_m: radiusFromBounds(southwest.lat, southwest.lng, northeast.lat, northeast.lng),
    address: result.formatted_address,
  };
}

async function geocodeWithOpenStreetMap(query) {
  const response = await fetch(
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query),
    { headers: { "User-Agent": "macathon-2026" } }
  );
  const [place] = await response.json();
  if (!place) return null;

  const [south, north, west, east] = place.boundingbox.map(Number);
  return {
    lat: Number(place.lat),
    lng: Number(place.lon),
    radius_m: radiusFromBounds(south, west, north, east),
    address: place.display_name,
  };
}

export async function geocode(address) {
  const queries = [...new Set([address, withoutUnit(address), placeName(withoutUnit(address))])].filter(Boolean);
  for (const geocoder of [geocodeWithGoogle, geocodeWithOpenStreetMap]) {
    for (const query of queries) {
      try {
        const place = await geocoder(query);
        if (place) return place;
      } catch (err) {
        console.warn("Geocoding failed:", err.message);
      }
    }
  }
  return null;
}

// Coordinates for stores saved before they were geocoded, worked out once per
// server run. Kept in memory rather than saved: saving would need a database rule
// letting users edit stores, which anyone could then use to move one.
const storeCache = new Map();

export async function getStoreLocation(store) {
  if (store.lat != null && store.lng != null) {
    return { lat: store.lat, lng: store.lng, radius_m: store.radius_m };
  }
  if (!storeCache.has(store.id)) {
    const lookup = geocode(store.address || store.name);
    storeCache.set(store.id, lookup);
    // Don't remember failures, so a network blip doesn't stick for the whole run
    lookup.then((place) => place || storeCache.delete(store.id));
  }
  return storeCache.get(store.id);
}

export { distanceMetres };
