import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { postApi } from "../lib/postApi";

type Props = {
  folderName: string;
  bucketName: string;
  onUploadComplete?: (url: string) => void;
};

const ImageUploader: React.FC<Props> = ({
  folderName,
  bucketName,
  onUploadComplete,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false); // the "Add a photo" popup

  const requestPermission = async (source: "library" | "camera") => {
    const { status } =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        source === "camera"
          ? "We need access to your camera to take a photo."
          : "We need access to your photos to upload an image."
      );
      return false;
    }
    return true;
  };

  // Opens the camera or the photo library, then uploads whatever was picked
  const pickFrom = async (source: "library" | "camera") => {
    const hasPermission = await requestPermission(source);
    if (!hasPermission) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true, // the backend uploads the image, so the app sends its data
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;

    const asset = result.assets[0];
    setImage(asset.uri);

    try {
      setUploading(true);

      const publicUrl = await postApi.uploadImage(bucketName, asset.base64);

      onUploadComplete?.(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert(
        "Upload failed",
        (err as any).response?.data?.error || "Check your internet connection and that you're signed in."
      );
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadImage = () => {
    // The camera is only offered on phones. On a computer go straight to the file picker.
    if (Platform.OS === "web") {
      pickFrom("library");
      return;
    }

    setSourceOpen(true);
  };
  /**
  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={pickAndUploadImage}>
        <Text style={styles.buttonText}>
          {uploading
            ? 'Uploading...'
            : image
            ? 'Change Image'
            : 'Upload Image'}
        </Text>
      </Pressable>

      {uploading && <ActivityIndicator />}

      {image && !uploading && (
        <Image source={{ uri: image }} style={styles.preview} />
      )}
    </View>
  );
 */
  return (
    <View style={styles.container}>
      {!image ? (
        <Pressable style={styles.button} onPress={pickAndUploadImage}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </Pressable>
      ) : (
        <Pressable onPress={pickAndUploadImage}>
          <Image source={{ uri: image }} style={styles.preview} />
        </Pressable>
      )}

      <Modal visible={sourceOpen} transparent animationType="fade" onRequestClose={() => setSourceOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSourceOpen(false)}>
          {/* Taps on the card are caught here so they don't close the popup */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Add a photo</Text>
            <Text style={styles.sheetSubtitle}>Where should it come from?</Text>

            <Pressable
              style={styles.sheetButton}
              onPress={() => { setSourceOpen(false); pickFrom("camera"); }}
            >
              <Text style={styles.sheetButtonText}>Take photo</Text>
            </Pressable>
            <Pressable
              style={styles.sheetButton}
              onPress={() => { setSourceOpen(false); pickFrom("library"); }}
            >
              <Text style={styles.sheetButtonText}>Choose from library</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setSourceOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ImageUploader;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
  },
  button: {
    backgroundColor: "#71A5D3",
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(42, 33, 29, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFF8F0",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#8C5A3C",
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8C5A3C",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#8C5A3C",
    textAlign: "center",
    marginBottom: 4,
  },
  sheetButton: {
    backgroundColor: "#71A5D3",
    borderWidth: 1,
    borderColor: "#8C5A3C",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#8C5A3C",
    fontSize: 16,
    fontWeight: "bold",
  },
});
