import React, { useMemo, useRef } from "react";
import { GestureResponderEvent, Platform, StyleSheet, View } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  UserLocationChangeEvent,
} from "react-native-maps";

// Expo Go on iOS can't show Google Maps, so it falls back to Apple Maps there.
// Real builds (expo run / EAS) use Google on both platforms.
const inIosExpoGo =
  Platform.OS === "ios" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const MAP_PROVIDER = inIosExpoGo ? undefined : PROVIDER_GOOGLE;

export interface MapLocation {
  id: string;
  storeId?: string | null;
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

// A touch that moves less than this, and lifts within TAP_MAX_MS, counts as a tap
const TAP_SLOP = 10;
const TAP_MAX_MS = 400;
// Area around a pin's point that counts as tapping it. Pins are drawn above
// their point, so the area reaches further up than down.
const PIN_HIT = { x: 25, above: 55, below: 15 };

interface LocationsMapProps {
  locations: MapLocation[];
  onSelect?: (location: MapLocation) => void;
  // Tapping the map itself, not a pin
  onMapPress?: () => void;
  // Height covered by a panel at the bottom, so pins stay visible above it
  bottomInset?: number;
}

export default function LocationsMap({
  locations,
  onSelect,
  onMapPress,
  bottomInset = 0,
}: LocationsMapProps) {
  const mapRef = useRef<MapView>(null);
  const centeredOnUser = useRef(false);
  const touchStart = useRef<{ x: number; y: number; pageX: number; pageY: number; time: number } | null>(
    null
  );

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

  const pinAt = async (x: number, y: number) => {
    const points = await Promise.all(
      pinned.map((loc) =>
        mapRef.current!.pointForCoordinate({ latitude: loc.lat!, longitude: loc.lng! }).catch(() => null)
      )
    );
    let closest: MapLocation | null = null;
    let closestDistance = Infinity;
    points.forEach((point, index) => {
      if (!point) return;
      const dx = x - point.x;
      const dy = y - point.y;
      if (Math.abs(dx) > PIN_HIT.x || dy < -PIN_HIT.above || dy > PIN_HIT.below) return;
      const distance = Math.hypot(dx, dy);
      if (distance < closestDistance) {
        closest = pinned[index];
        closestDistance = distance;
      }
    });
    return closest;
  };

  // The map's own tap event waits ~300ms to rule out a double-tap zoom, so taps
  // are detected from raw touches instead, letting the panel react straight away
  const handleTouchStart = (event: GestureResponderEvent) => {
    const { touches, locationX, locationY, pageX, pageY } = event.nativeEvent;
    touchStart.current =
      touches.length > 1 ? null : { x: locationX, y: locationY, pageX, pageY, time: Date.now() };
  };

  const handleTouchEnd = async (event: GestureResponderEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    const { pageX, pageY } = event.nativeEvent;
    if (
      !start ||
      Date.now() - start.time > TAP_MAX_MS ||
      Math.hypot(pageX - start.pageX, pageY - start.pageY) > TAP_SLOP
    ) {
      return;
    }
    const pin = pinned.length ? await pinAt(start.x, start.y) : null;
    if (pin) onSelect?.(pin);
    else onMapPress?.();
  };

  return (
    <View
      style={styles.map}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => (touchStart.current = null)}
    >
      <MapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={fitPins}
        showsUserLocation
        onUserLocationChange={centerOnUser}
        mapPadding={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}
      >
        {pinned.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat!, longitude: loc.lng! }}
            title={loc.title}
            description={loc.address}
            // Usually already handled by the touch check above; this catches
            // taps on the edge of a pin that it missed
            onPress={() => onSelect?.(loc)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
