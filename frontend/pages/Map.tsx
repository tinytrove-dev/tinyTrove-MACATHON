import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import LocationsMap, { MapLocation } from "../components/LocationsMap";
import StoreInfoPanel from "../components/StoreInfoPanel";

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
      />
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
