import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Pressable,} from "react-native";
import { supabase } from "../lib/supabase";

export default function PostDetail({ post, onBack, onOpenStore }) {
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (post?.id) {
      fetchPost();
    } else {
      setPostData(null);
      setLoading(false);
    }
  }, [post]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        caption,
        location,
        photo_url,
        stores ( name, address ),
        profiles!user_id ( username, display_name, avatar_url ),
        post_tags (
          treasure_tag (
            name
          )
        )
      `)
      .eq("id", post.id)
      .single();

    if (error) {
      console.error("Post detail fetch error", error);
      setError(error.message);
      setPostData(null);
    } else {
      setPostData(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7EA8D9" />
      </View>
    );
  }

  if (!postData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Post not found."}</Text>
      </View>
    );
  }

  const tagItems = [
    ...(postData?.post_tags
      ?.map((item) => item.treasure_tag?.name)
      .filter(Boolean) || []),
  ].filter(Boolean);

  if (!tagItems.length && postData?.treasure_tag) {
    if (typeof postData.treasure_tag === "string") {
      tagItems.push(postData.treasure_tag);
    } else if (Array.isArray(postData.treasure_tag)) {
      tagItems.push(...postData.treasure_tag.filter(Boolean));
    } else if (postData.treasure_tag?.name) {
      tagItems.push(postData.treasure_tag.name);
    }
  }

  const displayName =
    postData?.profiles?.display_name ||
    postData?.profiles?.username ||
    post?.profiles?.username ||
    post?.display_name ||
    "Username";
  const avatarUrl =
    postData?.profiles?.avatar_url || post?.profiles?.avatar_url || post?.photo_url || null;
  const storeLocation = postData?.location
    ? {
        id: postData.id,
        title: postData.location,
        address: postData.location,
      }
    : null;

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <Text style={styles.userName}>{displayName}</Text>
        </View>

        {postData.photo_url ? (
          <View style={styles.photoFrame}>
            <Image source={{ uri: postData.photo_url }} style={styles.photo} />
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>No image available</Text>
          </View>
        )}

        <Text style={styles.caption}>
          {postData.caption || "Post description not available."}
        </Text>

        <View style={styles.storeCard}>
          <View style={styles.storeIconWrap}>
            <Text style={styles.storeIcon}>📍</Text>
          </View>

          <Pressable
            style={styles.storeTextWrap}
            onPress={() => storeLocation && onOpenStore?.(storeLocation)}
            disabled={!storeLocation}
          >
            <Text style={styles.storeName}>
              {postData.location || "Shop name"}
            </Text>

            {postData.stores?.address ? (
              <Text style={styles.storeAddress}>{postData.stores.address}</Text>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.tagsRow}>
          {tagItems.length > 0 ? (
            tagItems.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>Kuromi</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>Sanrio</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>Tag 1</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFE6C9",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFE6C9",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ddd",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8d09e",
  },
  userName: {
    marginLeft: 10,
    fontSize: 22,
    color: "#2A211D",
  },
  photoFrame: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#8C5A3C",
    marginBottom: 16,
    
  },
  photo: {
    width: "100%",
    height: 320,
    resizeMode: "cover",
  },
  photoPlaceholder: {
    width: "100%",
    height: 320,
    borderRadius: 10,
    backgroundColor: "#f8d09e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderColor: "#8C5A3C",
    borderWidth: 3,
  },
  photoPlaceholderText: {
    color: "#735635",
    fontSize: 16,
  },
  caption: {
    fontSize: 18,
    lineHeight: 30,
    color: "#1F1A17",
    marginBottom: 14,
  },
  storeBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD09A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 0,
    marginBottom: 14,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD09A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  storeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#fec27e",
  },
  storeIcon: {
    fontSize: 18,
  },
  storeTextWrap: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A211D",
  },
  storeAddress: {
    fontSize: 14,
    color: "#5A4A40",
    marginTop: 4,
  },
  locationRow: {
    marginBottom: 14,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2A211D",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 16,
    color: "#4B423D",
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#7EA8D9",
    paddingHorizontal: 20,
    paddingVertical: 2,
    borderRadius: 20,
    height: 30,
    justifyContent: "center",
  },
  tagText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#B00020",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
