import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ImageSourcePropType, FlatList, Pressable } from "react-native";
import Button from "../components/button";
import { contentApi } from "../lib/contentApi";



export default function TreasureDetail({ treasure, onBack, onPostSelect, onFindLocations }) {
  const [posts, setPosts] = useState([]);
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    if (treasure?.id) {
      fetchPosts();
      fetchCommunity();
      // console.log(treasure)
      // console.log(treasure.id.replace(/^treasure-/, ""))
    }
  }, [treasure]);

  async function fetchPosts() {
    try {
      setPosts(await contentApi.getTreasurePosts(treasure.id));
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  }

  async function fetchCommunity() {
    try {
      setCommunity(await contentApi.getTreasureCommunity(treasure.id));
    } catch (error) {
      console.error('Error fetching community:', error);
      setCommunity(null);
    }
  }

  if (!treasure) return null;

  const groupImageSource =
    community?.photo_url
      ? { uri: community.photo_url }
      : require("./Image1.png");

  const characterImageSource =
    treasure.characterImageSource ??
    (treasure.photo ? { uri: treasure.photo } : require("./Image1.png"));

  const group = community?.name ?? "Unknown Community";
  const title = treasure.name ?? "Title";
  const descriptor = treasure.descriptor ?? "Description";
  console.log(treasure)

  const images = posts.map(p => ({
    id: p.id,
    source: { uri: p.photo_url || 'https://via.placeholder.com/100' },
    onClick: () => onPostSelect?.(p)
  }));

  const postLocations = useMemo(() => {
    const uniqueLocations = [...new Set(posts.map((post) => post.location).filter(Boolean))];

    return uniqueLocations.map((location, index) => ({
      id: `treasure-location-${index}`,
      title: location,
      address: location,
    }));
  }, [posts]);

  const headerComponent = (
    <>
      <View style={styles.topBar}>
        <Image source={groupImageSource} style={styles.groupImage} />
        <Text style={styles.title}>{group}</Text>
      </View>

      <View style={styles.profile}>
        <Image source={characterImageSource} style={styles.image} />

        <View style={styles.textBox}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.descriptor}>{descriptor}</Text>
        </View>
      </View>

      <View style={styles.middle}>
        <View style={styles.buttons}>
          <Button widthSize="medium" heightSize="small" onClick={() => onFindLocations?.(postLocations)}>
            Find
          </Button>
          <Button widthSize="medium" heightSize="small" onClick={() => {}}>
            Filter
          </Button>
        </View>
      </View>
    </>
  );

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <Pressable
          style={styles.gridItem}
          onPress={item.onClick}
        >
          <Image 
            source={item.source} 
            style={styles.gridImage} 
          />
        </Pressable>
      )}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No posts yet!</Text>
      }
      contentContainerStyle={styles.gridContainer}
      style={styles.page}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  topBar: {
    width: "100%",
    minHeight: 70,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#FFF0C9",
  },
  backButtonWrapper: {
    position: "absolute",
    top: 10,
    left: 12,
    zIndex: 100,
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    marginLeft: 10,
  },
  profile: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 9,
    backgroundColor: "#FFF8F0",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  textBox: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 32,
    fontWeight: "600",
  },
  descriptor: {
    fontSize: 16,
    marginTop: 4,
  },
  middle: {
    alignItems: "center",
  },
  buttons: {
    flexDirection: "row",
    marginTop: 9,
    gap: 30,
    backgroundColor: "#FFF8F0",
  },
  gridItem: { flex: 1/3, aspectRatio: 1, padding: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: 8 },
  gridContainer: { padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});
