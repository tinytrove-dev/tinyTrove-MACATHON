import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { contentApi } from "../lib/contentApi";

const filterOptions = [
  { key: "all", label: "All" },
  { key: "treasure", label: "Treasure" },
  { key: "community", label: "Community" },
  { key: "store", label: "Store" },
];

export function Search({ onStoreSelect, onCommunitySelect, onTreasureSelect }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [activeFilter, searchQuery]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const {
        communities: communityData,
        stores: storeData,
        treasures: treasureData,
      } = await contentApi.search(searchQuery.trim());

      //TODO: add function that gets community name of related character

      const communityResults = (communityData || []).map((community) => ({
        id: community.id, // Pure UUID
        type: "community",
        name: community.name,
        description: community.description,
        photo: community.photo_url,
        banner_url: community.banner_url,
        theme_color: community.theme_color || "#71A5D3",
        number_of_members: community.number_of_members || 0,
        treasures: community.treasures || 0,
      }));

      const storeResults = (storeData || []).map((store) => ({
        id: store.id, // Pure UUID
        type: "store",
        name: store.name,
        address: store.address,
      }));

      const treasureResults = (treasureData || []).map((treasure) => ({
        id: treasure.id, // Pure UUID
        type: "treasure",
        name: treasure.name,
        descriptor: treasure.descriptor,
        photo: treasure.photo,
      }));

      let combined = [];
      if (activeFilter === "all" || activeFilter === "community") {
        combined = combined.concat(communityResults);
      }
      if (activeFilter === "all" || activeFilter === "store") {
        combined = combined.concat(storeResults);
      }
      if (activeFilter === "all" || activeFilter === "treasure") {
        combined = combined.concat(treasureResults);
      }

      setResults(combined);
    } catch (error) {
      console.error("Search fetch failed", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case "treasure":
        return {
          card: styles.treasureCard,
          iconCircle: styles.treasureIcon,
          iconText: styles.treasureIconText,
        };
      case "community":
        return {
          card: styles.communityCard,
          iconCircle: styles.communityIcon,
          iconText: styles.communityIconText,
        };
      case "store":
      default:
        return {
          card: styles.storeCard,
          iconCircle: styles.storeIcon,
          iconText: styles.storeIconText,
        };
    }
  };

  //TODO: update render to show image instead of emoji.
  const renderResult = ({ item }) => {
    const typeStyles = getTypeStyles(item.type);
    const isPressable = item.type === "store" || item.type === "community" || item.type === "treasure";
    const handlePress = isPressable ? () => {
      if (item.type === "store") onStoreSelect(item);
      else if (item.type === "community") onCommunitySelect(item);
      else if (item.type === "treasure") onTreasureSelect(item);
    } : undefined;

    const CardComponent = isPressable ? Pressable : View;

    return (
      <CardComponent
        style={[styles.resultCard, typeStyles.card]}
        onPress={handlePress}
      >
        <View style={[styles.iconCircle, typeStyles.iconCircle]}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.resultImage} />
          ) : (
            <Text style={[styles.iconText, typeStyles.iconText]}>
              {item.type === "store" ? "🏪" : "⭐"}
            </Text>
          )}
        </View>
        <View style={styles.resultText}>
          <Text style={styles.resultName}>{item.name}</Text>
          {item.type === "treasure" && (
            <Text style={styles.resultMeta}>Treasure</Text>
          )}
          {item.type === "community" && (
            <Text style={styles.resultMeta}>
              {item.members} members · {item.treasures} treasures
            </Text>
          )}
          {item.type === "store" && (
            <Text style={styles.resultMeta}>{item.address}</Text>
          )}
        </View>
      </CardComponent>
    );
  };

  return (
    <View style={styles.page}>
      <Text style={styles.headerTitle}>Search</Text>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search treasures, communities, stores"
        placeholderTextColor="#aaa"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              styles.filterButton,
              activeFilter === option.key && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === option.key && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#71A5D3" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFE6C9",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2e1d14",
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e8d8d0",
    borderRadius: 999,
    marginBottom: 16,
    color: "#2e1d14",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,

    backgroundColor: "#FFD09A",
  },
  filterButtonActive: {
    backgroundColor: "#8C5A3C",
    borderColor: "#8C5A3C",
  },
  filterText: {
    color: "#8C5A3C",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsList: {
    paddingBottom: 40,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  treasureCard: {
    backgroundColor: "#FFF8F0",
    borderWidth: 4,
    borderColor: "#ff8fab",
  },
  communityCard: {
    backgroundColor: "#E8F2FF",
    borderWidth: 4,
    borderColor: "#71A5D3",
  },
  storeCard: {
    backgroundColor: "#f7e9de",
    borderWidth: 4,
    borderColor: "#8C5A3C",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  treasureIcon: {
    backgroundColor: "#FFE8EE",
  },
  communityIcon: {
    backgroundColor: "#DCE8F8",
  },
  storeIcon: {
    backgroundColor: "#E8D4C1",
  },
  resultImage: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  iconText: {
    fontSize: 24,
  },
  treasureIconText: {
    color: "#D9417D",
  },
  communityIconText: {
    color: "#2B5B8A",
  },
  storeIconText: {
    color: "#7A4C2A",
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#231f20",
    marginBottom: 6,
  },
  resultMeta: {
    fontSize: 14,
    color: "#6e5a68",
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#7a6b78",
    fontSize: 16,
  },
});
