import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image
} from "react-native";
import { authApi } from "./lib/authApi"; 

// --- SCREENS ---
import { LoginScreen } from './pages/Login';
import { ProfileScreen } from './pages/Profile';
import { HomeScreen } from './pages/Home';
import Map from './pages/Map'
import Post from './pages/Post';
import CreateCommunity from './pages/CommunityUpload';
import { Search } from './pages/Search';
import StoreMap from './pages/StoreMap';
import CommunityDetail from './pages/CommunityDetail';
import TreasureDetail from './pages/TreasureDetail';
import PostDetail from './pages/PostDetail';
import Button from './components/button';
import { SafeAreaView } from "react-native-safe-area-context";

const pages = [
  { key: "post", label: "Post" },
  { key: "search", label: "Search" },
  { key: "profile", label: "Profile" },
];

export default function App() {
  // Auth State
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Navigation State
  const [activePage, setActivePage] = useState("profile");
  const [currentStore, setCurrentStore] = useState(null);
  const [currentCommunity, setCurrentCommunity] = useState(null);
  const [currentTreasure, setCurrentTreasure] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [currentMapLocations, setCurrentMapLocations] = useState([]);
  const [previousPage, setPreviousPage] = useState("search");

  const handleLogout = () => {
    setSession(null);
    setUserId(null);
  };

  const handleStoreSelect = (store, origin = "search") => {
    setCurrentStore(store);
    setPreviousPage(origin);
    setActivePage("storeMap");
  };

  const handleCommunitySelect = (community, origin = "search") => {
    setCurrentCommunity(community);
    setPreviousPage(origin);
    setActivePage("communityDetail");
  };

  const handleTreasureSelect = (treasure, origin = "search") => {
    setCurrentTreasure(treasure);
    setPreviousPage(origin);
    setActivePage("treasureDetail");
  };

  const handlePostSelect = (post, origin = "profile") => {
    setCurrentPost(post);
    setPreviousPage(origin);
    setActivePage("postDetail");
  };

  const handleMapOpen = (locations, origin = "search") => {
    setCurrentMapLocations(locations || []);
    setPreviousPage(origin);
    setActivePage("map");
  };

  const handleLoginSuccess = (user) => {
    setSession(user);
    setUserId(user?.id);
    fetchUserCommunities(user?.id);
  };

  const fetchUserCommunities = async (idToUse) => {
    const targetId = idToUse || userId;
    if (!targetId) return;
    try {
      // Note: Use getUserCommunities (singular) as defined in your authApi
      const data = await authApi.getUserCommunities(targetId);
      console.log("Successfully synced membership data.");
    } catch (err) {
      console.error("Failed to sync communities:", err);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF8FAB" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const showBackButton = ["postDetail", "storeMap", "communityDetail", "treasureDetail", "map"].includes(activePage);

  const handleHeaderBack = () => {
    switch (activePage) {
      case "postDetail":
        setActivePage("profile");
        break;
      case "storeMap":
      case "communityDetail":
      case "treasureDetail":
        setActivePage("search");
        break;
      case "map":
        setActivePage(previousPage);
        break;
      default:
        setActivePage("home");
        break;
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "home":
        return <HomeScreen onLogout={handleLogout} />;
      case "map":
        return <Map locations={currentMapLocations} />;
      case "post":
        return <Post userId={userId} setActivePage={setActivePage} />;
      case "search":
        return (
          <Search
            onStoreSelect={(store) => handleStoreSelect(store, "search")}
            onCommunitySelect={(community) => handleCommunitySelect(community, "search")}
            onTreasureSelect={(treasure) => handleTreasureSelect(treasure, "search")}
          />
        );
      case 'profile': 
        return (
          <ProfileScreen 
            userId={userId} 
            onLogout={handleLogout} 
            onCommunitySelect={(community) => handleCommunitySelect(community, 'profile')} 
            onPostSelect={(post) => handlePostSelect(post, 'profile')}
            onCreateCommunity={() => {
              setPreviousPage('profile'); 
              setActivePage('createCommunity');
            }}
          />
        );
      case "createCommunity":
        return <CreateCommunity userId={userId} onGoBack={() => setActivePage('profile')} />;
      case "storeMap":
        return <StoreMap store={currentStore} onBack={() => setActivePage(previousPage)} />;
      case "communityDetail":
        return (
          <CommunityDetail
            community={currentCommunity}
            userId={userId}
            onBack={() => setActivePage(previousPage)}
            onTreasureSelect={(treasure) => handleTreasureSelect(treasure, "community")}
            onPostSelect={(post) => handlePostSelect(post, "community")}
            checkStatus={() => fetchUserCommunities(userId)} 
          />
        );
      case "treasureDetail":
        return (
          <TreasureDetail
            treasure={currentTreasure}
            onBack={() => setActivePage(previousPage)}
            onPostSelect={(post) => { setCurrentPost(post); setActivePage("postDetail"); }}
            onFindLocations={(locations) => handleMapOpen(locations, "treasureDetail")}
          />
        );
      case "postDetail":
        return (
          <PostDetail
            post={currentPost}
            onBack={() => setActivePage(previousPage)}
            onOpenStore={(location) => handleMapOpen([location], "postDetail")}
          />
        );
      default:
        return <HomeScreen onLogout={handleLogout} />;
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {showBackButton && (
          <View style={styles.backButtonWrapper}>
            <Button widthSize="icon" heightSize="icon" onClick={handleHeaderBack}>
              ←
            </Button>
          </View>
        )}

        <Image
          source={{ uri: "https://hhygpdtwzluzgvagrbqm.supabase.co/storage/v1/object/public/CommunityPictures/sketch1775967349277.png" }}
          style={{ width: 120, height: 120, alignSelf: 'center', paddingBottom: 0, marginTop: 0, marginBottom: -30 }}
          resizeMode="contain"
        />

        
      </View>

      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      <View style={styles.footer}>
        {pages.map((page) => (
          <Pressable
            key={page.key}
            style={[styles.navButton, activePage === page.key && styles.activeButton]}
            onPress={() => setActivePage(page.key)}
          >
            <Text style={[styles.navButtonText, activePage === page.key && styles.activeButtonText]}>
              {page.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#211A19" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    paddingBottom: 14,
    backgroundColor: "#211A19",
    borderTopWidth: 1,
    borderTopColor: "#332a29",
  },
  navButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  activeButton: { backgroundColor: "#71A5D3" },
  navButtonText: { fontWeight: "600", color: "#FFE6C9", fontSize: 12 },
  activeButtonText: { color: "#FFF8F0" },
});
