import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { postApi } from "../lib/postApi";

type Props = {
  // "Posts" | "ProfilePictures"; files are stored under the signed-in user's folder
  bucketName: string;
  onUploadComplete?: (url: string) => void;
};

const ImageUploader: React.FC<Props> = ({
  bucketName,
  onUploadComplete,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to upload an image."
      );
      return false;
    }
    return true;
  };

  const pickAndUploadImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

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
        err.response?.data?.error || "Check your internet connection."
      );
    } finally {
      setUploading(false);
    }
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
});
