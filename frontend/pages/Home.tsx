import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { authApi } from '../lib/authApi';

export function HomeScreen({ onLogout }) {
  
  async function handleSignOut() {
    try {
      await authApi.signOut();
      Alert.alert('Success', 'You have been signed out');
      onLogout();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to tinyTrove!</Text>
      <Text style={styles.subtitle}>You are successfully logged in.</Text>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, marginBottom: 32 },
  button: { backgroundColor: '#FF8FAB', padding: 12, borderRadius: 8 },
  buttonText: { color: '#FFF', fontWeight: 'bold' }
});