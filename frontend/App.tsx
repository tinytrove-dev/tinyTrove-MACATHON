import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image
} from "react-native";
import { setOnSessionExpired } from "./lib/axios";

// --- SCREENS ---
import { LoginScreen } from './pages/Login';
import { ProfileScreen } from './pages/Profile';
import Feed from './pages/Feed';
import Map from './pages/Map'
import Post from './pages/Post';
import CreateCommunity from './pages/CommunityUpload';
import { Search } from './pages/Search';
import StoreMap from './pages/StoreMap';
import CommunityDetail from './pages/CommunityDetail';
import TreasureDetail from './pages/TreasureDetail';
import PostDetail from './pages/PostDetail';
import PostPager from './pages/PostPager';
import Button from './components/button';

const tabs = [
  { key: "feed", label: "Feed" },
  { key: "search", label: "Search" },
  { key: "post", label: "Post" },
  { key: "profile", label: "Profile" },
];

// Pages guests can't use; they see the sign-in screen instead
const SIGNED_IN_PAGES = ["post", "profile", "createCommunity"];

// A route is { page, item }: `item` is whatever that page displays
// (a post, a store, map locations...). Keeping it on the route means
// going back always shows the right thing.
const HOME_ROUTE: { page: string; item: any } = { page: "feed", item: null };

export default function App() {
  // Auth State
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);

  // Navigation State
  const [route, setRoute] = useState<{ page: string; item: any }>(HOME_ROUTE);
  const [history, setHistory] = useState<{ page: string; item: any }[]>([]);

  const navigate = (page: string, item: any = null) => {
    setHistory((prev) => [...prev, route]);
    setRoute({ page, item });
  };

  const goBack = () => {
    setRoute(history[history.length - 1] ?? HOME_ROUTE);
    setHistory((prev) => prev.slice(0, -1));
  };

  const openTab = (page) => {
    setHistory([]);
    setRoute({ page, item: null });
  };

  const handleLogout = () => {
    setSession(null);
    setUserId(null);
    openTab("feed");
  };

  // Send the user back to the feed as a guest if their session can't be refreshed
  useEffect(() => {
    setOnSessionExpired(handleLogout);
    return () => setOnSessionExpired(null);
  }, []);

  const handleLoginSuccess = (user) => {
    setSession(user);
    setUserId(user?.id);
    // Return to whatever prompted the sign-in
    if (route.page === "login") goBack();
  };

  const requireSignIn = () => navigate("login");

  const page = route.page;
  const showsLogin = page === "login" || (!session && SIGNED_IN_PAGES.includes(page));
  const showBackButton = history.length > 0;

  // The feed stays mounted (just hidden) while you're in something opened from it,
  // so coming back keeps your scroll position and the posts already loaded
  const feedInStack = page === "feed" || history.some((r) => r.page === "feed");
  const showsFeed = page === "feed" && !showsLogin;

  const renderContent = () => {
    if (showsLogin) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    switch (page) {
      case "feed":
        return null; // rendered separately below so it survives navigation
      case "map":
        return <Map locations={route.item || []} />;
      case "post":
        return <Post userId={userId} setActivePage={openTab} />;
      case "search":
        return (
          <Search
            onStoreSelect={(store) => navigate("storeMap", store)}
            onCommunitySelect={(community) => navigate("communityDetail", community)}
            onTreasureSelect={(treasure) => navigate("treasureDetail", treasure)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            userId={userId}
            onLogout={handleLogout}
            onCommunitySelect={(community) => navigate("communityDetail", community)}
            onPostSelect={(post) => navigate("postDetail", post)}
            onCreateCommunity={() => navigate("createCommunity")}
          />
        );
      case "createCommunity":
        return <CreateCommunity userId={userId} onGoBack={goBack} />;
      case "storeMap":
        return <StoreMap store={route.item} onBack={goBack} />;
      case "communityDetail":
        return (
          <CommunityDetail
            community={route.item}
            userId={userId}
            onBack={goBack}
            onTreasureSelect={(treasure) => navigate("treasureDetail", treasure)}
            onPostSelect={(post, posts) =>
              navigate("postPager", { posts, index: Math.max(posts.indexOf(post), 0) })
            }
            onRequireSignIn={requireSignIn}
          />
        );
      case "treasureDetail":
        return (
          <TreasureDetail
            treasure={route.item}
            onBack={goBack}
            onPostSelect={(post) => navigate("postDetail", post)}
            onFindLocations={(locations) => navigate("map", locations)}
          />
        );
      case "postDetail":
        return (
          <PostDetail
            post={route.item}
            userId={userId}
            onBack={goBack}
            onOpenStore={(location) => navigate("map", [location])}
            onRequireSignIn={requireSignIn}
          />
        );
      case "postPager":
        return (
          <PostPager
            posts={route.item.posts}
            initialIndex={route.item.index}
            userId={userId}
            onBack={goBack}
            onOpenStore={(location) => navigate("map", [location])}
            onRequireSignIn={requireSignIn}
          />
        );
      default:
        return null;
    }
  };

  // The active tab stays highlighted while browsing pages opened from it
  const activeTab = [route, ...history.slice().reverse()]
    .map((r) => r.page)
    .find((p) => tabs.some((tab) => tab.key === p));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {showBackButton && (
          <View style={styles.backButtonWrapper}>
            <Button widthSize="icon" heightSize="icon" onClick={goBack}>
              ←
            </Button>
          </View>
        )}

        {/* Login has its own large logo */}
        {!showsLogin && (
          <Image
            source={{ uri: "https://hhygpdtwzluzgvagrbqm.supabase.co/storage/v1/object/public/CommunityPictures/sketch1775967349277.png" }}
            style={{ width: 120, height: 120, alignSelf: 'center', paddingBottom: 0, marginTop: 0, marginBottom: -30 }}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.mainContent}>
        {feedInStack && (
          <View style={[styles.feedLayer, !showsFeed && styles.hidden]}>
            <Feed
              userId={userId}
              onPostSelect={(post) => navigate("postDetail", post)}
              onRequireSignIn={requireSignIn}
            />
          </View>
        )}
        {!showsFeed && renderContent()}
      </View>

      <View style={styles.footer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.navButton, activeTab === tab.key && styles.activeButton]}
            onPress={() => openTab(tab.key)}
          >
            <Text style={[styles.navButtonText, activeTab === tab.key && styles.activeButtonText]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#211A19" },
  header: {
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",

    borderBottomColor: "#211A19",
    position: "relative",
  },

  backButtonWrapper: {
    position: "absolute",
    left: 12,
    top: 40,
    zIndex: 1,

  },


  mainContent: {
    flex: 1,
  },
  feedLayer: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    paddingBottom: 35,
    backgroundColor: "#211A19",
    borderTopWidth: 1,
    borderTopColor: "#332a29",
  },
  navButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  activeButton: { backgroundColor: "#71A5D3" },
  navButtonText: { fontWeight: "600", color: "#FFE6C9", fontSize: 12 },
  activeButtonText: { color: "#FFF8F0" },
});
