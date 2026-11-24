import React, { useMemo, useState } from "react";
import { Alert, View, StyleSheet } from "react-native";
import LocationsMap, { MapLocation } from "../components/LocationsMap";
import MapFilters from "../components/MapFilters";
import StoreInfoPanel from "../components/StoreInfoPanel";
import { getCheckLocation } from "../lib/location";
import {
  Coordinates,
  MapFilterValues,
  NO_FILTERS,
  hasActiveFilters,
  matchesFilters,
} from "../lib/mapFilters";

interface MapProps {
  locations?: MapLocation[];
  onPostSelect?: (post: { id: string }) => void;
  onTreasureSelect?: (treasure: { id: string }) => void;
}

export default function Map({ locations = [], onPostSelect, onTreasureSelect }: MapProps) {
  // Opening a single place (like a store) shows its details straight away
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    locations.length === 1 ? locations[0] : null
  );
  const [collapsed, setCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  const [filters, setFilters] = useState<MapFilterValues>(NO_FILTERS);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);

  // Filters only make sense for a treasure's places, which come with details
  const showFilters = locations.some((location) => location.details);

  const highlightedIds = useMemo(() => {
    if (!hasActiveFilters(filters)) return null;
    return new Set(
      locations
        .filter((location) => matchesFilters(location, filters, userLocation))
        .map((location) => location.id)
    );
  }, [locations, filters, userLocation]);

  const changeFilters = async (next: MapFilterValues) => {
    setFilters(next);
    // Distance needs to know where the user is, so only ask once it's chosen
    if (next.distanceKm == null || userLocation) return;
    setLocating(true);
    const position = await getCheckLocation();
    setLocating(false);
    if (position) {
      setUserLocation({ lat: position.lat, lng: position.lng });
    } else {
      setFilters((current) => ({ ...current, distanceKm: null }));
      Alert.alert("Location needed", "Turn on location for this app to filter by distance.");
    }
  };

  const selectLocation = (location: MapLocation) => {
    setSelectedLocation(location);
    setCollapsed(false);
  };

  return (
    <View style={styles.page}>
      <LocationsMap
        locations={locations}
        onSelect={selectLocation}
        onMapPress={() => setCollapsed(true)}
        bottomInset={selectedLocation ? panelHeight : 0}
        highlightedIds={highlightedIds}
      />
      {showFilters && (
        <MapFilters
          values={filters}
          onChange={changeFilters}
          matchCount={highlightedIds?.size ?? locations.length}
          totalCount={locations.length}
          locating={locating}
        />
      )}
      {selectedLocation && (
        <StoreInfoPanel
          location={selectedLocation}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
          onPostSelect={onPostSelect}
          onTreasureSelect={onTreasureSelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFE6C9",
    position: "relative",
    // The minimised panel slides below the bottom edge
    overflow: "hidden",
  },
});
