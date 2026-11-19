import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { authApi } from "../lib/authApi";
import { postApi } from "../lib/postApi";
import * as ImagePicker from "expo-image-picker";

export function ProfileScreen({
  userId,
  onLogout,
  onCommunitySelect,
  onPostSelect,
  onCreateCommunity
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userId) {
      getProfileData();
    }
  }, [userId, refreshKey]);

  async function getProfileData() {
    try {
      setLoading(true);
      const [profileData, postsData, communitiesData] = await Promise.all([
        authApi.getProfile(userId),
        authApi.getPosts(userId),
        authApi.getUserCommunities(userId)
      ]);

      setProfile(profileData);
      setPosts(postsData || []);
      setCommunities(communitiesData || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await authApi.signOut();
      Alert.alert("Success", "You have been signed out");
      onLogout();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Need access to photos to upload.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true, // the backend uploads the image, so the app sends its data
    });

    if (result.canceled) return;
    const asset = result.assets[0];

    try {
      setUploading(true);
      // Upload through the backend as the signed-in user, then save the link to the profile
      const photoUrl = await postApi.uploadImage("ProfilePictures", asset.base64);
      await authApi.updateAvatar(photoUrl);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      Alert.alert(
        "Upload failed",
        (err as any).response?.data?.error || "Could not update profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#71A5D3" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={{ uri: profile?.avatar_url || "https://via.placeholder.com/160" }}
            style={styles.avatar}
          />
          <View style={styles.profileDetails}>
            <Text style={styles.displayName}>{profile?.display_name || "Collector"}</Text>
            <Text style={styles.username}>@{profile?.username || "username"}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{communities.length}</Text>
                <Text style={styles.statLabel}>Communities</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.editButton} onPress={pickAndUploadImage}>
                <Text style={styles.editButtonText}>{uploading ? "..." : "Update Pic"}</Text>
              </Pressable>
              <Pressable style={styles.signOutButtonSmall} onPress={handleSignOut}>
                <Text style={styles.signOutTextSmall}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === "posts" && styles.activeTabButton]}
          onPress={() => setActiveTab("posts")}
        >
          <Text style={styles.tabText}>Posts</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "communities" && styles.activeTabButton]}
          onPress={() => setActiveTab("communities")}
        >
          <Text style={styles.tabText}>Communities</Text>
        </Pressable>
      </View>

      {/* --- CONTENT --- */}
      {/* --- CONTENT AREA --- */}
      <View style={styles.contentArea}>
        {activeTab === "posts" ? (
          <FlatList
            key="posts-grid" // 👈 Unique key prevents numColumns crash
            data={posts}
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            renderItem={({ item }) => (
              <Pressable style={styles.gridItem} onPress={() => onPostSelect?.(item)}>
                <Image source={{ uri: item.photo_url }} style={styles.gridImage} />
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No posts yet!</Text>}
          />
        ) : (
          <FlatList
            key="communities-list" // 👈 Unique key forces a fresh render
            data={communities}
            keyExtractor={(item) => String(item.id)}
            numColumns={1} // Explicitly set to 1 for the list view
            ListHeaderComponent={
              <Pressable style={styles.createBtn} onPress={onCreateCommunity}>
                <Text style={styles.createBtnText}>+ Create New Community</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => onCommunitySelect?.(item)}>
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: item.cover_image_url || item.photo_url }}
                    style={styles.cardImage}
                  />
                </View>
                {/* Optimized cardText container */}
                <View style={styles.cardText}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.number_of_members || 0} members
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No communities yet!</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFD09A" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFD09A" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#FFD09A" },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#FFF8F0" },
  profileDetails: { flex: 1, marginLeft: 15 },
  displayName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  username: { fontSize: 14, color: "#5a2835", marginBottom: 10 },
  statsRow: { flexDirection: "row", marginBottom: 10 },
  statBox: { marginRight: 20, alignItems: 'center' },
  statNumber: { fontSize: 16, fontWeight: "bold" },
  statLabel: { fontSize: 10, color: "#4C433E" },
  actionRow: { flexDirection: "row", gap: 8 },
  editButton: { backgroundColor: "#71A5D3", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  editButtonText: { color: "#fff", fontSize: 12 },
  signOutButtonSmall: { backgroundColor: "#D86D55", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  signOutTextSmall: { color: "#fff", fontSize: 12 },
  tabRow: { flexDirection: "row", backgroundColor: "#FFD09A" },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTabButton: { borderBottomColor: "#4B2E2B" },
  tabText: { fontWeight: "600", color: "#4B2E2B" },
  contentArea: { flex: 1, backgroundColor: "#FFE6C9" },
  gridItem: { flex: 1/3, aspectRatio: 1, padding: 1 },
  gridImage: { width: "100%", height: "100%" },
  createBtn: { backgroundColor: "#71A5D3", margin: 15, padding: 12, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: "#fff", fontWeight: "bold" },
  card: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 10, padding: 12, borderRadius: 12, alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', marginRight: 12 },
  cardImage: { width: "100%", height: "100%" },
  cardName: { fontWeight: "bold", fontSize: 16 },
  cardMeta: { fontSize: 12, color: "#666" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#6A625B" },
  cardText: { flex: 1, justifyContent: "center" },
});
