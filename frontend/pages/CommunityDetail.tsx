import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import Button from "../components/button";
import { contentApi } from "../lib/contentApi";
import { authApi } from "../lib/authApi";
import CreateTag from "./TagCreation";

export default function CommunityDetail({ 
  community, 
  onBack, 
  onTreasureSelect, 
  onPostSelect,
  userId,
  onRequireSignIn
}) {
  const [treasures, setTreasures] = useState([]);
  const [posts, setPosts] = useState([]);
  
  // Logic states
  const [localMemberStatus, setLocalMemberStatus] = useState("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // --- 1. MEMBERSHIP LOGIC ---
  useEffect(() => {
    const fetchMembership = async () => {
      if (!userId || !community?.id) return;
      try {
        const currentId = String(community.id).replace(/^community-/, "");
        const isJoined = await authApi.isMember(currentId);
        setLocalMemberStatus(isJoined ? "member" : "non-member");
      } catch (error) {
        setLocalMemberStatus("non-member");
      }
    };
    fetchMembership();
  }, [userId, community?.id]);

  const handleJoin = useCallback(async () => {
    if (!userId) return onRequireSignIn?.();
    setActionLoading(true);
    try {
      await authApi.joinCommunity(community.id);
      Alert.alert("Success", "Welcome to the Club!");
      setLocalMemberStatus("member");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not join community");
    } finally {
      setActionLoading(false);
    }
  }, [community, userId, onRequireSignIn]);

  const handleLeave = useCallback(async () => {
    Alert.alert("Leave Club?", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await authApi.leaveCommunity(community.id);
            setLocalMemberStatus("non-member");
          } catch (error) {
            Alert.alert("Error", "Could not leave community");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }, [community, userId]);

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    if (community?.id) {
      fetchCommunityContent();
    }
  }, [community]);

  async function fetchCommunityContent() {
    const communityId = String(community.id).replace(/^community-/, "");

    try {
      const { treasures, posts } = await contentApi.getCommunityContent(communityId);
      setTreasures(treasures);
      setPosts(posts);
    } catch (error) {
      console.error("Error fetching community treasures/posts:", error);
      setTreasures([]);
      setPosts([]);
    }
  }

  if (!community) return null;

  // Formatting User UI Data
  const photo_url = community.photo ?? community.photo_url ?? "";
  const banner_url = community.banner_url ?? "";
  const title = community.name ?? "Community Name";
  const members = community.number_of_members ?? "0";
  const memberJoined = localMemberStatus === "member";

  const treasureItems = treasures.map((item) => ({
    id: `treasure-${item.id}`,
    source: { uri: item.photo || "https://via.placeholder.com/80" },
    onClick: () => onTreasureSelect?.({
      ...item,
      id: `treasure-${item.id}`,
      photo: item.photo,
      descriptor: item.descriptor,
    }),
  }));

  const postImages = posts.map((item) => ({
    id: item.id,
    source: { uri: item.photo_url || "https://via.placeholder.com/100" },
    // Pass the whole list so the post can be swiped through to its neighbours
    onClick: () => onPostSelect?.(item, posts),
  }));

  // --- 3. HEADER COMPONENT (Wrapped in useMemo for touch reliability) ---
  const renderHeader = useMemo(() => (
    <>
      <View style={styles.topSection}>
        
        {/* Banner */}
        <View style={styles.frame}>
          <Image
            source={{ uri: banner_url }}
            style={styles.banner_url}
            resizeMode="cover"
          />
        </View>

        {/* Profile Info - Margined Upwards */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: photo_url }}
            style={styles.photo_url}
            resizeMode="cover"
          />
          <View style={styles.infoContainer}>
            <View style={styles.titleText}>
              <Text style={styles.title}>{title}</Text>

              <View style={styles.memberBox}>
                <Text style={styles.members}>{members} members</Text>
                
                {/* Dynamically controlled Custom Button */}
                <Button 
                  widthSize="medium" 
                  heightSize="small" 
                  onClick={memberJoined ? handleLeave : handleJoin}
                >
                  {actionLoading ? "Loading..." : (memberJoined ? "Leave Club" : "Join Club")}
                </Button>
              </View>
            </View>
          </View>
        </View>

        {/* Treasures Section */}
        <View style={styles.treasureContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.treasureList}
          >
            {treasureItems.map((item) => (
              <Pressable key={item.id} onPress={item.onClick} style={styles.treasureItem}>
                <Image source={item.source} style={styles.treasureImage} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Tags & Posts Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Community Treasure Posts</Text>
          
          {/* Create Tag Button (Only shows if they are a member) */}
          {memberJoined && (
            <Pressable style={styles.createTagButton} onPress={() => setIsCreatingTag(true)}>
              <Text style={styles.createTagText}>+ New Tag</Text>
            </Pressable>
          )}
        </View>
      </View>
    </>
  ), [banner_url, photo_url, title, members, treasureItems, memberJoined, actionLoading, handleJoin, handleLeave]);

  // --- 4. MAIN RETURN ---
  return (
    <View style={styles.page}>
      {/* Your Grid */}
      <FlatList
        data={postImages}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} onPress={item.onClick}>
            <Image source={item.source} style={styles.gridImage} />
          </Pressable>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No posts yet!</Text>
        }
        contentContainerStyle={styles.gridContainer}
      />

      {/* Tag Creation Modal */}
      <Modal visible={isCreatingTag} animationType="slide">
        <CreateTag 
          userId={userId} 
          communityId={community.id} 
          onGoBack={() => {
            setIsCreatingTag(false); 
            fetchCommunityContent(); // Refresh UI instantly when done
          }} 
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  // --- ADDED FOR NAVIGATION ---
  topNav: { 
    position: 'absolute', 
    top: 50, 
    left: 16, 
    zIndex: 9999, 
    elevation: 15,
  },
  backButton: { 
    backgroundColor: "rgba(0,0,0,0.5)", 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  backButtonText: { color: 'white', fontWeight: 'bold' },
  // ----------------------------

  topSection: {
    flexShrink: 0,
  },
  frame: {
    width: "100%",
    height: 140,
    overflow: "hidden",
  },
  banner_url: {
    width: "100%",
    height: "100%",
  },
  profileSection: {
    marginTop: -50, // Creates the overlap
    paddingHorizontal: 20,
  },
  photo_url: {
    height: 100,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#fff",
    borderRadius: 50, // Added border radius so it is circular (optional, adjust as needed)
  },
  infoContainer: {
    marginTop: 5,
    backgroundColor: "#FFF8F0",
    paddingBottom: 0,
  },
  title: {
    fontSize: 40,
  },
  members: {
    fontSize: 20,
  },
  titleText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberBox: {
    flexDirection: "column",
    alignItems: "center",
  },
  treasureContainer: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#FFD09A",
  },
  treasureList: {
    paddingHorizontal: 12,
    gap: 12,
    alignItems: "center",
  },
  treasureItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  treasureImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFF8F0",
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  createTagButton: {
    backgroundColor: '#71A5D3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  createTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  gridContainer: {
    padding: 10,
    paddingBottom: 40, // Added slight bottom padding to list
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});