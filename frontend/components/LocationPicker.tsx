import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import { contentApi } from "../lib/contentApi";
import { SafeAreaView } from "react-native-safe-area-context";

interface LocationPickerProps {
  chooseLocation: (location: string) => void;
}

export interface LocationProps {
  id: string;
  name: string;
  address: string;
}

export default function LocationPicker({
  chooseLocation,
}: LocationPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<LocationProps[]>([]);

  // Fetch stores from the backend
  useEffect(() => {
    async function fetchStores() {
      try {
        setStores(await contentApi.getStores());
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    }

    fetchStores();
  }, []);

  // Filter results
  const filtered = stores.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View>
      {/* TRIGGER */}
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Text style={styles.triggerText}>
          {location ? location : "Add location"}
        </Text>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      {/* MODAL */}

      <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.header}>
            <TextInput
              style={styles.input}
              placeholder="Search location..."
              value={query}
              onChangeText={setQuery}
            />
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* 🔥 NO RESULTS BUTTON (UNDER SEARCH BAR) */}
          {query.trim().length > 0 && filtered.length === 0 && (
            <View style={{ paddingHorizontal: 20 }}>
              <Pressable
                style={styles.addButton}
                onPress={async () => {
                try {
                  // 1. Backend geocodes the name and saves the store
                  const inserted = await contentApi.createStore(query);

                  // 2. Update UI
                  chooseLocation(inserted.name);
                  setLocation(inserted.name);
                  setModalVisible(false);
                  setQuery("");

                  // 3. Update local state instantly
                  setStores((prev) => [...prev, inserted]);
                } catch (err) {
                  console.error("Failed to add location:", err);

                  // fallback
                  chooseLocation(query);
                  setLocation(query);
                  setModalVisible(false);
                  setQuery("");
                }
              }}
            >
              <Text style={styles.addButtonText}>
                Location not in list? Add "{query.replace(/\b\w/g, c => c.toUpperCase())}"
              </Text>
            </Pressable>
            </View>
          )}

          {/* LIST */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  chooseLocation(item.name);
                  setLocation(item.name);
                  setModalVisible(false);
                  setQuery("");
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: "#666", fontSize: 12 }}>
                  {item.address}
                </Text>
              </Pressable>
            )}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: "100%",
    backgroundColor: "#FFE6C9",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },

  triggerText: {
    fontSize: 16,
    color: "#211A19",
  },

  arrow: {
    fontSize: 20,
    color: "#211A19",
  },

  modal: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  input: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e8d8d0",
    marginRight: 10,
    color: "#2e1d14",
  },

  closeButton: {
    padding: 10,
  },

  closeText: {
    fontSize: 24,
    color: "#666",
  },

  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  addButton: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: "#4F8CFF",
    borderRadius: 10,
  },

  addButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
