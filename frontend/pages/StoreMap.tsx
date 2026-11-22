import React, { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import LocationsMap, { MapLocation } from "../components/LocationsMap";
import StoreInfoPanel from "../components/StoreInfoPanel";

export default function StoreMap({ store, onBack }) {
  const storeLocation: MapLocation | null = store
    ? { id: store.id, title: store.name, address: store.address, lat: store.lat, lng: store.lng }
    : null;
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(storeLocation);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      {/* Map */}
      <LocationsMap
        locations={storeLocation ? [storeLocation] : []}
        onSelect={setSelectedLocation}
      />

      {/* Store Info Panel - Always visible */}
      {selectedLocation && (
        <StoreInfoPanel location={selectedLocation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FF8FAB',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});