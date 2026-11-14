import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator, Keyboard } from "react-native";
import { postApi } from "../lib/postApi";
import { useKeyboardScroll } from "../lib/useKeyboardScroll";

export default function CreateCommunity({ userId, onGoBack }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const descriptionRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const { scrollRef, onScroll, keyboardPadding, scrollToInput } = useKeyboardScroll();

  const handleCreate = async () => {
    if (!name) return Alert.alert("Error", "Name is required");
    setLoading(true);
    try {
      await postApi.createCommunity(userId, name, description);
      Alert.alert("Success", "Trove Created!");
      onGoBack(); // Go back to profile
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 20 + keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New Community</Text>
        <TextInput
          ref={nameRef}
          onFocus={() => scrollToInput(nameRef)}
          style={[styles.input]}
          placeholder=" Name of Community"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          ref={descriptionRef}
          onFocus={() => scrollToInput(descriptionRef)}
          style={[styles.input, { height: 100 }]}
          placeholder="Description"
          multiline
          value={description}
          placeholderTextColor="#000000"
          onChangeText={setDescription}
        />

        <Pressable style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
        </Pressable>

        <Pressable onPress={onGoBack} style={{ marginTop: 20 }}>
          <Text style={{ textAlign: 'center', color: '#666' }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  input: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#FF8FAB', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
