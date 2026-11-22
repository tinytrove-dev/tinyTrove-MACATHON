import React, { useMemo, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import MapView, { Marker, PROVIDER_GOOGLE, UserLocationChangeEvent } from "react-native-maps";

// Expo Go on iOS can't show Google Maps, so it falls back to Apple Maps there.
// Real builds (expo run / EAS) use Google on both platforms.
const inIosExpoGo =
  Platform.OS === "ios" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const MAP_PROVIDER = inIosExpoGo ? undefined : PROVIDER_GOOGLE;

export interface MapLocation {
  id: string;
  title: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

// Monash Clayton, shown when there's nothing to pin and no user location yet
const DEFAULT_REGION = {
  latitude: -37.9016,
  longitude: 145.1155,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const hasCoords = (loc: MapLocation) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng);

interface LocationsMapProps {
  locations: MapLocation[];
  onSelect?: (location: MapLocation) => void;
}

export default function LocationsMap({ locations, onSelect }: LocationsMapProps) {
  const mapRef = useRef<MapView>(null);
  const centeredOnUser = useRef(false);

  const pinned = useMemo(() => locations.filter(hasCoords), [locations]);
  const coordinates = pinned.map((loc) => ({ latitude: loc.lat!, longitude: loc.lng! }));

  const initialRegion = coordinates.length
    ? { ...coordinates[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  const fitPins = () => {
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
        animated: false,
      });
    }
  };

  // With no pins, move to the user once, rather than following them around
  const centerOnUser = (event: UserLocationChangeEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    if (coordinates.length || centeredOnUser.current || !coordinate) return;
    centeredOnUser.current = true;
    mapRef.current?.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <MapView
      ref={mapRef}
      provider={MAP_PROVIDER}
      style={styles.map}
      initialRegion={initialRegion}
      onMapReady={fitPins}
      showsUserLocation
      onUserLocationChange={centerOnUser}
    >
      {pinned.map((loc) => (
        <Marker
          key={loc.id}
          coordinate={{ latitude: loc.lat!, longitude: loc.lng! }}
          title={loc.title}
          description={loc.address}
          onPress={() => onSelect?.(loc)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
