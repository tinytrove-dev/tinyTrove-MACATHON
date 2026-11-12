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

export interface TagPickerProps {
  addTag: (tag: TagProps) => void;
  removeTag: (tag: TagProps) => void;
}

export interface TagProps {
  id: string;
  name: string;
  photo: string;
}

export default function TagPicker({ addTag, removeTag }: TagPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tags, setTags] = useState<TagProps[]>([]);
  const [allTags, setAllTags] = useState<TagProps[]>([]);
  const [query, setQuery] = useState("");

  const mockTags = ["Kuromi", "Hello Kitty", "Pikachu"];

  useEffect(() => {
    async function fetchTags() {
      try {
        setAllTags(await contentApi.getTreasures());
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    }

    fetchTags();
  }, []);

  // const filtered = mockTags.filter((item) =>
  //  item.toLowerCase().includes(query.toLowerCase())
  //);

  const filtered = allTags.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddTag = (tag: TagProps) => {
    if (!tags.includes(tag)) {
      const updated = [...tags, tag];
      setTags(updated);
      addTag(tag);
    }
  };

  const handleRemoveTag = (tag: TagProps) => {
    const updated = tags.filter((t) => t.id !== tag.id);
    setTags(updated);
    removeTag(tag);
  };

  return (
    <View>
      {/* TRIGGER */}
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Text style={styles.triggerText}>Tags</Text>

        <View style={styles.right}>
          <Text style={styles.count}>{tags.length}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide">
                  <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.header}>
            <TextInput
              style={styles.input}
              placeholder="Search tags..."
              value={query}
              onChangeText={setQuery}
            />
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {tags.length > 0 && (
            <View style={styles.selectedBox}>
              {tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>

                  <Pressable onPress={() => handleRemoveTag(tag)}>
                    <Text style={styles.remove}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* LIST */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.item} onPress={() => handleAddTag(item)}>
                <Text>{item.name}</Text>
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

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  count: {
    fontSize: 14,
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

  selectedBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    padding: 20,
  },

  tag: {
    flexDirection: "row",
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
  },

  tagText: {
    marginRight: 6,
    color: "#333",
  },

  remove: {
    fontSize: 16,
    color: "#666",
  },

  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
