import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";

//todo: get real info
const tempImage1 = require("./profile_temp.png");
const tempImage2 = require("./gridimage_temp.jpg");

const samplePhotos = [
  { id: "1", uri: tempImage1, caption: "Kuromi" },
  { id: "2", uri: tempImage2, caption: "My Melody" },
  { id: "3", uri: tempImage1, caption: "Pom Purin" },
  { id: "4", uri: tempImage2, caption: "Baby Yoda" },
];

const gridPhotos = [
  { id: "1", uri: tempImage1 },
  { id: "2", uri: tempImage2 },
  { id: "3", uri: tempImage1 },
  { id: "4", uri: tempImage2 },
  { id: "5", uri: tempImage1 },
  { id: "6", uri: tempImage2 },
];

interface StoreInfoPanelProps {
  location: {
    id: string;
    title: string;
    address: string;
  };
  onClose?: () => void;
}

export default function StoreInfoPanel({ location, onClose }: StoreInfoPanelProps) {
  const screenWidth = Dimensions.get("window").width;
  const panelHorizontalMargin = 24; // left 12 + right 12
  const panelInnerPadding = 20; // paddingHorizontal 10 on both sides
  const gridGap = 8;
  const gridItemWidth =
    (screenWidth - panelHorizontalMargin - panelInnerPadding - gridGap) / 2;

  const renderPhotoCarousel = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image source={item.uri} style={styles.carouselImage} />
      <Text style={styles.carouselCaption}>{item.caption}</Text>
    </View>
  );

  const renderGridPhoto = ({ item }) => (
    <View style={styles.gridItemWrapper}>
      <Image source={item.uri} style={styles.gridImage} />
    </View>
  );

  return (
    <View style={styles.panel}>
      <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollContent}>
        {/* Header with Name and Address */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.storeName}>{location.title}</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.storeAddress}>{location.address}</Text>
        </View>

        {/* Horizontal Scrollable Photos */}
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Treasures</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
          >
            {samplePhotos.map((photo) => (
              <View key={photo.id}>{renderPhotoCarousel({ item: photo })}</View>
            ))}
          </ScrollView>
        </View>

        {/* Grid of Photos */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <FlatList
            scrollEnabled={false}
            data={gridPhotos}
            renderItem={renderGridPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    maxHeight: "68%",
    backgroundColor: "#FFD09A",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    marginBottom: 10,
    backgroundColor: "#8C5A3C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  storeName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF8F0",
    flex: 1,
    marginBottom: 2,
  },

  closeBtn: {
    paddingLeft: 8,
    paddingTop: 2,
  },

  closeBtnText: {
    fontSize: 20,
    color: "#FFF8F0",
    fontWeight: "400",
  },

  storeAddress: {
    fontSize: 14,
    color: "#FFF8F0",
  },

  carouselSection: {
    marginBottom: 12,
    backgroundColor: "#FFE6C9",
    borderRadius: 10,
    padding: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A291F",
    marginBottom: 8,
  },

  carousel: {
    flexDirection: "row",
  },

  carouselItem: {
    marginRight: 10,
    alignItems: "center",
  },

  carouselImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#FFE6C9",
  },

  carouselCaption: {
    fontSize: 12,
    color: "#6B5342",
    marginTop: 5,
    textAlign: "center",
    width: 70,
  },

  gridSection: {
    backgroundColor: "#FFE6C9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  gridRow: {
  justifyContent: "space-between",
  marginBottom: 8,
  },

  gridItemWrapper: {
    width: "48.5%",
    aspectRatio: 1,
  },

  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },

});