import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import LocationPicker from "../components/LocationPicker";
import TagPicker, { TagProps } from "../components/TagPicker";
import { postApi } from "../lib/postApi";
import ImageUploader from "../components/ImageUpload";
import { supabase } from "../lib/supabase";
import { useKeyboardScroll } from "../lib/useKeyboardScroll";

// If using TypeScript (.tsx), use: export default function Post({ userId }: { userId: string })
export default function Post({ userId, setActivePage }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [tags, setTags] = useState<TagProps[]>([]);

  // ADDED: State for the image URL since your backend requires it
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const descriptionRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const { scrollRef, onScroll, keyboardPadding, scrollToInput } = useKeyboardScroll();

  const handleUploadComplete = (url: string) => {
    console.log("url", url);
    // console.log('Image uploaded successfully:', url);
    setUploadedImageUrl(url);
  };

  const updateProfilePicture = async (userId: string, photo_url: string) => {
    try {
      const { error } = await supabase
        .from("profiles") // to update
        .update({ avatar_url: photo_url })
        .eq("id", userId);

      if (error) throw error;

      console.log("Profile picture updated");
      // setRefreshKey(prev => prev + 1);
      //getProfileData(); // delete
    } catch (err) {
      console.error(err);
    }
  };
  async function submitPost() {
    // Safety check before calling the API
    if (!userId) {
      Alert.alert("Error", "Missing User ID. Are you logged in?");
      return;
    }

    if (!location) {
      Alert.alert("Error", "Location is required");
      return;
    }

    if (tags.length === 0) {
      Alert.alert("Error", "At least one tag is required");
      return;
    }

    setLoading(true);
    try {
      const response = await postApi.createPost(
        userId,
        uploadedImageUrl,
        description,
        location,
        tags
      );

      Alert.alert("Success", "Post Created!");

      // Navigate to profile
      setActivePage?.('profile');

      // Clear the form after success
      setTitle("");
      setDescription("");
      setImage("");
      setTags([]);
      setLocation(null);
    } catch (error) {
      // Axios errors hide the message in error.response.data
      const errorMsg = error.response?.data?.error || error.message;
      Alert.alert("Server Error", errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: keyboardPadding }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.title}>New Post</Text>

        <ImageUploader
          folderName={userId || "anonymous"}
          bucketName="Posts"
          onUploadComplete={handleUploadComplete}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          ref={descriptionRef}
          onFocus={() => scrollToInput(descriptionRef)}
          style={[styles.input, styles.textArea]}
          placeholder="What's your collection?"
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <LocationPicker chooseLocation={setLocation} />

        {/* Fixed the filter bug here */}
        <TagPicker
          addTag={(newItem) => {
            setTags([...tags, newItem]);
          }}
          removeTag={(itemToRemove) =>
            setTags(tags.filter((t) => t !== itemToRemove))
          }
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={submitPost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Post</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFD09A",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100, // Extra padding for ScrollView
  },
  title: {
    fontSize: 30,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#FFF8F0",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: "#333", // Darker text color for input
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top", // Required for Android multiline
  },
  button: {
    backgroundColor: "#7EA8D9",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center", // Better than alignSelf for full width
  },
  buttonDisabled: {
    backgroundColor: "#A0C1FF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
