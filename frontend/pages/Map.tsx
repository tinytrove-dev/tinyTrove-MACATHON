import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import LocationsMap, { MapLocation } from "../components/LocationsMap";
import StoreInfoPanel from "../components/StoreInfoPanel";

export default function Map({ locations = [] }: { locations?: MapLocation[] }) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  return (
    <View style={styles.page}>
      <LocationsMap locations={locations} onSelect={setSelectedLocation} />
      {selectedLocation && (
        <StoreInfoPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
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
  },
});
