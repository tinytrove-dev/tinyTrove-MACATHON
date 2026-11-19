import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { contentApi } from "../lib/contentApi";
import { postApi } from "../lib/postApi";
import PostChecks from "../components/PostChecks";
import StockBanner from "../components/StockBanner";

export default function PostDetail({ post, userId, onBack, onOpenStore, onRequireSignIn }) {
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

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

    try {
      const [postResult, commentsResult] = await Promise.all([
        contentApi.getPost(post.id),
        contentApi.getComments(post.id),
      ]);
      setPostData(postResult);
      setComments(commentsResult);
    } catch (err: any) {
      console.error("Post detail fetch error", err);
      setError(err.response?.data?.error || err.message);
      setPostData(null);
    }

    setLoading(false);
  };

  const submitComment = async () => {
    const body = commentText.trim();
    if (!body || sendingComment) return;

    setSendingComment(true);
    try {
      const newComment = await postApi.addComment(post.id, body);
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Could not post comment");
    } finally {
      setSendingComment(false);
    }
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
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StockBanner summary={postData} />

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

        <View style={styles.actionsRow}>
          <PostChecks
            postId={postData.id}
            summary={postData}
            isSignedIn={!!userId}
            isMine={postData.is_mine}
            onRequireSignIn={onRequireSignIn}
            onChange={(summary) => setPostData((prev) => ({ ...prev, ...summary }))}
          />
          <Text style={styles.validateHint}>
            {postData.is_mine
              ? "Gone back and it's gone? Mark it sold out so nobody makes a wasted trip."
              : "Been there? Validate it's still in stock, or report it sold out."}
          </Text>
        </View>

        {/* --- COMMENTS --- */}
        <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

        {comments.length === 0 && (
          <Text style={styles.noComments}>No comments yet.</Text>
        )}

        {comments.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            {comment.profiles?.avatar_url ? (
              <Image source={{ uri: comment.profiles.avatar_url }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, { backgroundColor: "#f8d09e" }]} />
            )}
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>
                {comment.profiles?.display_name || comment.profiles?.username || "Collector"}
              </Text>
              <Text style={styles.commentText}>{comment.body}</Text>
            </View>
          </View>
        ))}

        {userId ? (
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#8C7A6B"
              value={commentText}
              onChangeText={setCommentText}
              maxLength={500}
              multiline
              editable={!sendingComment}
            />
            <Pressable
              style={[styles.sendButton, (!commentText.trim() || sendingComment) && styles.sendDisabled]}
              onPress={submitComment}
              disabled={!commentText.trim() || sendingComment}
            >
              <Text style={styles.sendText}>{sendingComment ? "..." : "Post"}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onRequireSignIn}>
            <Text style={styles.signInToComment}>Sign in to comment ›</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  actionsRow: {
    marginTop: 18,
  },
  validateHint: {
    fontSize: 13,
    color: "#5A4A40",
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A211D",
    marginTop: 24,
    marginBottom: 10,
  },
  noComments: {
    fontSize: 14,
    color: "#5A4A40",
    marginBottom: 10,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ddd",
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2A211D",
  },
  commentText: {
    fontSize: 15,
    color: "#1F1A17",
    marginTop: 2,
    lineHeight: 21,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#8C5A3C",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: "#1F1A17",
  },
  sendButton: {
    backgroundColor: "#71A5D3",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  signInToComment: {
    color: "#71A5D3",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 6,
  },
});
