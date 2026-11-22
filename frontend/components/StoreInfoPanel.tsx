import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import { contentApi } from "../lib/contentApi";
import type { MapLocation } from "./LocationsMap";

const fallbackImage = require("./profile_temp.png");

// Space left under the header when minimised, matching the panel's padding
const COLLAPSED_BOTTOM_GAP = 10;

interface PlaceTreasure {
  id: string;
  name: string;
  descriptor?: string;
  photo?: string;
  post_count: number;
}

interface PlacePost {
  id: string;
  photo_url?: string;
  caption?: string;
}

interface StoreInfoPanelProps {
  location: MapLocation;
  collapsed?: boolean;
  // Called when the user taps or drags the header to minimise or reopen it
  onCollapsedChange?: (collapsed: boolean) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onPostSelect?: (post: PlacePost) => void;
  onTreasureSelect?: (treasure: PlaceTreasure) => void;
}

export default function StoreInfoPanel({
  location,
  collapsed = false,
  onCollapsedChange,
  onLayout,
  onPostSelect,
  onTreasureSelect,
}: StoreInfoPanelProps) {
  const [content, setContent] = useState<{ treasures: PlaceTreasure[]; posts: PlacePost[] } | null>(null);
  const [failed, setFailed] = useState(false);

  // Minimising slides the whole panel down until only the header shows
  const [panelHeight, setPanelHeight] = useState(0);
  const [headerBottom, setHeaderBottom] = useState(0);
  const collapsedOffset = Math.max(0, panelHeight - headerBottom - COLLAPSED_BOTTOM_GAP);
  const translateY = useRef(new Animated.Value(0)).current;

  // Kept in refs so the drag handlers, created once, see current values
  const dragState = useRef({ start: 0, collapsedOffset, collapsed, onCollapsedChange });
  dragState.current.collapsedOffset = collapsedOffset;
  dragState.current.collapsed = collapsed;
  dragState.current.onCollapsedChange = onCollapsedChange;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: collapsed ? collapsedOffset : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();
  }, [collapsed, collapsedOffset, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      // Only take over for vertical drags, so taps still reach the header
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          dragState.current.start = value;
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const { start, collapsedOffset: max } = dragState.current;
        const next = start + dy;
        // Resist dragging past fully open, rather than stopping dead
        translateY.setValue(next < 0 ? next / 4 : Math.min(next, max));
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const { start, collapsedOffset: max, collapsed: wasCollapsed, onCollapsedChange: notify } =
          dragState.current;
        const position = start + dy;
        // A quick flick decides it; otherwise go to whichever end is closer
        const shouldCollapse = Math.abs(vy) > 0.5 ? vy > 0 : position > max / 2;
        if (shouldCollapse === wasCollapsed) {
          Animated.spring(translateY, {
            toValue: shouldCollapse ? max : 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 14,
          }).start();
        }
        notify?.(shouldCollapse);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setFailed(false);
    contentApi
      .getPlaceContent({ storeId: location.storeId, name: location.title })
      .then((data) => !cancelled && setContent(data))
      .catch((error) => {
        console.error("Error fetching store content:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [location.storeId, location.title]);

  const renderSectionBody = (items: unknown[], emptyText: string, render: () => React.ReactNode) => {
    if (failed) return <Text style={styles.emptyText}>Couldn't load this right now.</Text>;
    if (!content) return <ActivityIndicator color="#8C5A3C" style={styles.loading} />;
    if (items.length === 0) return <Text style={styles.emptyText}>{emptyText}</Text>;
    return render();
  };

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateY }] }]}
      onLayout={(event) => {
        setPanelHeight(event.nativeEvent.layout.height);
        onLayout?.(event);
      }}
    >
      {/* Header with Name and Address: tap or drag it to minimise or reopen */}
      <View
        {...panResponder.panHandlers}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setHeaderBottom(y + height);
        }}
      >
        <Pressable
          onPress={() => onCollapsedChange?.(!collapsed)}
          style={styles.header}
          accessibilityRole="button"
          accessibilityLabel={collapsed ? "Show store details" : "Minimise store details"}
        >
          <View style={styles.handle} />
          <Text style={styles.storeName}>{location.title}</Text>
          {location.address && location.address !== location.title ? (
            <Text style={styles.storeAddress}>{location.address}</Text>
          ) : null}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollContent}>
        {/* Treasures posted here */}
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Treasures</Text>
          {renderSectionBody(content?.treasures ?? [], "No treasures spotted here yet.", () => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {content!.treasures.map((treasure) => (
                <Pressable
                  key={treasure.id}
                  style={styles.carouselItem}
                  onPress={() => onTreasureSelect?.(treasure)}
                >
                  <Image
                    source={treasure.photo ? { uri: treasure.photo } : fallbackImage}
                    style={styles.carouselImage}
                  />
                  <Text style={styles.carouselCaption} numberOfLines={2}>
                    {treasure.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ))}
        </View>

        {/* Posts from here */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {renderSectionBody(content?.posts ?? [], "No posts from here yet.", () => (
            <View style={styles.grid}>
              {content!.posts.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.gridItemWrapper}
                  onPress={() => onPostSelect?.(post)}
                >
                  <Image
                    source={post.photo_url ? { uri: post.photo_url } : fallbackImage}
                    style={styles.gridImage}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    maxHeight: "68%",
    backgroundColor: "#FFD09A",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    marginBottom: 10,
    backgroundColor: "#8C5A3C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 248, 240, 0.6)",
    marginBottom: 8,
  },

  storeName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF8F0",
    marginBottom: 2,
  },

  storeAddress: {
    fontSize: 14,
    color: "#FFF8F0",
  },

  carouselSection: {
    marginBottom: 12,
    backgroundColor: "#FFE6C9",
    borderRadius: 10,
    padding: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A291F",
    marginBottom: 8,
  },

  carousel: {
    flexDirection: "row",
  },

  carouselItem: {
    marginRight: 10,
    alignItems: "center",
  },

  carouselImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#FFE6C9",
  },

  carouselCaption: {
    fontSize: 12,
    color: "#6B5342",
    marginTop: 5,
    textAlign: "center",
    width: 70,
  },

  gridSection: {
    backgroundColor: "#FFE6C9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItemWrapper: {
    width: "48.5%",
    aspectRatio: 1,
    marginBottom: 8,
  },

  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B5342",
  },

  loading: {
    alignSelf: "flex-start",
  },

});