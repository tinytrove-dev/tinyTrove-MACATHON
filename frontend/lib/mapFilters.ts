import type { MapLocation } from "../components/LocationsMap";

export type StockFilter = "any" | "in_stock" | "not_sold_out";

export interface MapFilterValues {
  distanceKm: number | null;
  maxPrice: number | null;
  stock: StockFilter;
  withinDays: number | null;
}

export const NO_FILTERS: MapFilterValues = {
  distanceKm: null,
  maxPrice: null,
  stock: "any",
  withinDays: null,
};

interface Option<T> {
  label: string;
  value: T;
}

// The first option of each is "off"
export const FILTER_OPTIONS: {
  distanceKm: Option<number | null>[];
  maxPrice: Option<number | null>[];
  stock: Option<StockFilter>[];
  withinDays: Option<number | null>[];
} = {
  distanceKm: [
    { label: "Any distance", value: null },
    { label: "Within 2 km", value: 2 },
    { label: "Within 5 km", value: 5 },
    { label: "Within 10 km", value: 10 },
    { label: "Within 25 km", value: 25 },
  ],
  maxPrice: [
    { label: "Any price", value: null },
    { label: "Under $20", value: 20 },
    { label: "Under $50", value: 50 },
    { label: "Under $100", value: 100 },
  ],
  stock: [
    { label: "Any stock", value: "any" },
    { label: "In stock", value: "in_stock" },
    { label: "Not sold out", value: "not_sold_out" },
  ],
  withinDays: [
    { label: "Any time", value: null },
    { label: "Past 3 days", value: 3 },
    { label: "Past week", value: 7 },
    { label: "Past month", value: 30 },
  ],
};

export const hasActiveFilters = (filters: MapFilterValues) =>
  filters.distanceKm != null ||
  filters.maxPrice != null ||
  filters.stock !== "any" ||
  filters.withinDays != null;

export interface Coordinates {
  lat: number;
  lng: number;
}

// Straight-line distance, which is close enough for "how far is it"
export const distanceKm = (a: Coordinates, b: Coordinates) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// A place matches when it passes every active filter. Places missing the
// information a filter needs (no price posted, say) don't match that filter.
export const matchesFilters = (
  location: MapLocation,
  filters: MapFilterValues,
  userLocation: Coordinates | null
) => {
  const details = location.details ?? {};

  if (filters.distanceKm != null) {
    if (!userLocation || location.lat == null || location.lng == null) return false;
    if (distanceKm(userLocation, { lat: location.lat, lng: location.lng }) > filters.distanceKm) {
      return false;
    }
  }

  if (filters.maxPrice != null && (details.price == null || details.price >= filters.maxPrice)) {
    return false;
  }

  if (filters.stock === "in_stock" && details.stockStatus !== "validated") return false;
  if (filters.stock === "not_sold_out" && details.stockStatus === "sold_out") return false;

  if (filters.withinDays != null) {
    const cutoff = Date.now() - filters.withinDays * 864e5;
    if (!details.lastSeenAt || new Date(details.lastSeenAt).getTime() < cutoff) return false;
  }

  return true;
};
