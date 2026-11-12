import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';

// --- SCREENS ---
import { LoginScreen } from './pages/Login';
import { ProfileScreen } from './pages/Profile';
import { HomeScreen } from './pages/Home';
import { Map } from './pages/Map';
import { Post } from './pages/Post';
import { Search } from './pages/Search';

// --- NAVIGATION CONFIG ---
const pages = [
  { key: "home", label: "Home" },
  { key: "map", label: "Map" },
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
  const [activePage, setActivePage] = useState("home");

  useEffect(() => {
    // TODO: Check for stored auth token and set session
    // For now, user starts logged out
    setIsInitializing(false);
  }, []);

  const handleLogout = () => {
    setSession(null);
    setUserId(null);
  };

  const handleLoginSuccess = (user) => {
    setSession(user);
    setUserId(user?.id);
  };

  // --- LOADING STATE ---
  if (isInitializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF8FAB" />
      </View>
    );
  }

  // --- AUTH GATE: If no session, show Login ---
  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // --- MAIN APP: If logged in, show Navigation ---
  const renderContent = () => {
    switch (activePage) {
      case 'home': return <HomeScreen onLogout={handleLogout} />;
      case 'profile': return <ProfileScreen userId={userId} onLogout={handleLogout} />;
      case 'map': return <Map />;
      case 'post': return <Post userId={userId} setActivePage={setActivePage} />;
      case 'search': return <Search />;
      default: return <HomeScreen onLogout={handleLogout} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>tinyTrove</Text>
      </View>

      {/* Main Page Content */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {pages.map((page) => (
          <Pressable
            key={page.key}
            style={[
              styles.navButton,
              activePage === page.key && styles.activeButton,
            ]}
            onPress={() => setActivePage(page.key)}
          >
            <Text style={[
              styles.navButtonText,
              activePage === page.key && styles.activeButtonText
            ]}>
              {page.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: '#FF8FAB',
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: "#FFE5EC", // Light pink highlight
  },
  navButtonText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 12,
  },
  activeButtonText: {
    color: "#FF8FAB", // Main pink
  },
});