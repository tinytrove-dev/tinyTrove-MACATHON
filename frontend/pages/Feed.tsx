import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { contentApi } from "../lib/contentApi";
import PostChecks from "../components/PostChecks";
import StockBanner from "../components/StockBanner";
import { timeAgo } from "../lib/timeAgo";

const PAGE_SIZE = 20;

export default function Feed({ userId, onPostSelect, onRequireSignIn }) {
  const [items, setItems] = useState<any[]>([]);
  const [mode, setMode] = useState("popular");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setError(null);
    try {
      const data = await contentApi.getFeed(0, PAGE_SIZE);
      setItems(data.items);
      setMode(data.mode);
      setHasMore(data.has_more);
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't load the feed.");
    }
  }, []);

  // Reload when the user signs in or out, since the ranking changes
  useEffect(() => {
    setLoading(true);
    loadFirstPage().finally(() => setLoading(false));
  }, [userId, loadFirstPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const data = await contentApi.getFeed(items.length, PAGE_SIZE);
      // The ranking can shift between pages, so skip anything already shown
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...data.items.filter((item) => !seen.has(item.id))];
      });
      setHasMore(data.has_more);
    } catch (err: any) {
      console.error("Feed pagination failed", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateItem = (id, changes) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const renderItem = ({ item }) => {
    const author = item.profiles?.display_name || item.profiles?.username || "Collector";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.author} numberOfLines={1}>{author}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {timeAgo(item.created_at)}{item.location ? ` · 📍 ${item.location}` : ""}
            </Text>
          </View>
        </View>

        {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

        <StockBanner summary={item} compact />

        <Pressable onPress={() => onPostSelect?.(item)}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.meta}>No image</Text>
            </View>
          )}
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
          ) : null}
        </Pressable>

        {item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {/* `item` carries the check summary fields; it only changes when updated */}
          <PostChecks
            postId={item.id}
            summary={item}
            isSignedIn={!!userId}
            isMine={item.user_id === userId}
            onRequireSignIn={onRequireSignIn}
            onChange={(summary) => updateItem(item.id, summary)}
            trailing={
              <Pressable style={styles.commentButton} onPress={() => onPostSelect?.(item)}>
                <Text style={styles.commentText}>💬 {item.comment_count}</Text>
              </Pressable>
            }
          />
        </View>
      </View>
    );
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
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8C5A3C" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>{mode === "personalized" ? "For you" : "Popular finds"}</Text>
            {!userId && (
              <Pressable onPress={onRequireSignIn}>
                <Text style={styles.signInHint}>Sign in to personalise your feed ›</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error || "No finds yet. Be the first to post one!"}</Text>
            {error && (
              <Pressable style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color="#71A5D3" /> : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFE6C9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFE6C9" },
  list: { padding: 14, paddingBottom: 28 },
  listHeader: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#2A211D" },
  signInHint: { marginTop: 4, color: "#71A5D3", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8C5A3C",
    padding: 12,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ddd" },
  avatarPlaceholder: { backgroundColor: "#f8d09e" },
  headerText: { flex: 1, marginLeft: 10 },
  author: { fontSize: 16, fontWeight: "700", color: "#2A211D" },
  meta: { fontSize: 13, color: "#5A4A40", marginTop: 1 },
  reason: {
    alignSelf: "flex-start",
    backgroundColor: "#FFD09A",
    color: "#8C5A3C",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: "#f8d09e" },
  photoPlaceholder: { justifyContent: "center", alignItems: "center" },
  caption: { fontSize: 16, lineHeight: 22, color: "#1F1A17", marginTop: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tagChip: { backgroundColor: "#7EA8D9", paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20 },
  tagText: { color: "#fff", fontSize: 13 },
  actions: { marginTop: 12 },
  commentButton: { paddingHorizontal: 10, paddingVertical: 5 },
  commentText: { fontSize: 14, color: "#2A211D", fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 15, color: "#5A4A40", textAlign: "center" },
  retryButton: { marginTop: 12, backgroundColor: "#71A5D3", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
});
