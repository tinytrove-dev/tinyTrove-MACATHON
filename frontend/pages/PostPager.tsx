import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import PostDetail from "./PostDetail";

// Shows a list of posts one at a time; swipe sideways for the next or previous one.
// Each page is a full PostDetail, and FlatList only renders the pages near the one
// on screen, so posts load as you get close to them rather than all at once.
export default function PostPager({ posts, initialIndex = 0, userId, onBack, onOpenStore, onRequireSignIn }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(initialIndex);

  return (
    <View style={styles.page} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          data={posts}
          keyExtractor={(post) => String(post.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          initialNumToRender={1}
          windowSize={3} // the current page plus one either side
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <PostDetail
                post={item}
                userId={userId}
                onBack={onBack}
                onOpenStore={onOpenStore}
                onRequireSignIn={onRequireSignIn}
              />
            </View>
          )}
        />
      )}

      {posts.length > 1 && (
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>
            {index + 1} / {posts.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFE6C9",
  },
  counter: {
    position: "absolute",
    top: 12,
    right: 14,
    backgroundColor: "rgba(42, 33, 29, 0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: {
    color: "#FFF8F0",
    fontSize: 13,
    fontWeight: "600",
  },
});
