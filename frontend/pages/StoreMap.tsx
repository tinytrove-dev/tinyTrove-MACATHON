import React, { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { WebView } from "react-native-webview";
import StoreInfoPanel from "../components/StoreInfoPanel";

export default function StoreMap({ store, onBack }) {
  const [selectedLocation, setSelectedLocation] = useState(store ? {
    id: store.id,
    title: store.name,
    address: store.address
  } : null);

  const locations = store ? [{
    id: store.id,
    title: store.name,
    address: store.address
  }] : [];

  const locationsJson = JSON.stringify(locations);
  const mapsAPIKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=marker"></script>
    <style>
      html, body { height: 100%; margin: 0; padding: 0; }
      #container { display: flex; flex-direction: column; height: 100%; }
      #map { flex: 1; width: 100%; }
      #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <div id="container">
      <div id="map"></div>
    </div>
    <div id="loading">Loading map...</div>
    <script>
      let map;
      let markers = [];
      const defaultCenter = { lat: -37.9016, lng: 145.1155 };
      const locations = ${locationsJson};

      function clearMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
      }

      async function geocodeAddress(address) {
        const response = await fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=${mapsAPIKey}');
        const data = await response.json();
        if (data.results && data.results[0]) {
          return data.results[0].geometry.location;
        }
        return null;
      }

      async function addMarkers(locations) {
        clearMarkers();
        for (const loc of locations) {
          const position = await geocodeAddress(loc.address);
          if (position) {
            const marker = new google.maps.Marker({
              position: position,
              map: map,
              title: loc.title || loc.address
            });
            google.maps.event.addListener(marker, 'click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', location: loc }));
            });
            markers.push(marker);
          }
        }
      }

      function initMap(center) {
        const mapElement = document.getElementById('map');
        map = new google.maps.Map(mapElement, {
          zoom: 15,
          center: center
        });

        addMarkers(locations);

        document.getElementById('loading').style.display = 'none';
      }

      // Try to get user's location or center on the store
      if (locations.length > 0) {
        geocodeAddress(locations[0].address).then(position => {
          if (position) {
            initMap(position);
          } else {
            initMap(defaultCenter);
          }
        });
      } else {
        initMap(defaultCenter);
      }
    </script>
  </body>
</html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        setSelectedLocation(data.location);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      {/* Map */}
      <WebView
        source={{ html: mapHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
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
  webview: {
    flex: 1,
  },
});