import React, { useState } from 'react';
import { View, Image,  Text, TextInput, Alert, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { authApi } from '../lib/authApi';

export function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggles between Login and Sign Up

  async function signInWithEmail() {
    setLoading(true);
    try {
      const response = await authApi.signIn(email, password);
      Alert.alert('Success', 'You are signed in!');
      onLoginSuccess(response.user);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    // 1. Basic validation
    if (!username || !displayName) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.signUp(email, password, username, displayName);
      if (response.session) {
        Alert.alert('Success', 'Welcome to tinyTrove!');
        onLoginSuccess(response.user);
      } else {
        Alert.alert('Almost there', 'Check your email to verify your account, then sign in.');
        setIsSignUp(false);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://hhygpdtwzluzgvagrbqm.supabase.co/storage/v1/object/public/CommunityPictures/tinytrove.png" }}
        style={{ width: 300, height: 300, alignSelf: 'center', marginBottom: 0, marginTop: 30, }}
        resizeMode="contain"
      />
      <View style={styles.headerContainer}>
        
        <Text style={styles.subtitle}>{isSignUp ? 'Join the community.' : 'Find your next obsession.'}</Text>
      </View>

      <View style={styles.inputContainer}>
        {/* Only show these fields if the user is signing up */}
        {isSignUp && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#000000"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name (e.g., Sanrio Fan)"
              placeholderTextColor="#000000"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#000000"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000000"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.primaryButton} 
          onPress={isSignUp ? signUpWithEmail : signInWithEmail}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>}
        </Pressable>

        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => setIsSignUp(!isSignUp)} // Toggles the form mode
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFD09A', padding: 20, },
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 42, fontWeight: 'bold', color: '#8C5A3C' },
  subtitle: { fontSize: 16, color: '#8C5A3C', marginTop: 8 },
  inputContainer: { gap: 12, marginBottom: 24},
  input: { borderWidth: 1,textAlignVertical: "center", backgroundColor: '#FFF8F0', borderColor: "#8C5A3C", paddingLeft: 12, paddingBottom: 0,paddingTop: 0, borderRadius: 999, fontSize: 16, height: 36, justifyContent: "center"},
  buttonContainer: { gap: 12, color: '#8C5A3C' },
  primaryButton: { backgroundColor: '#71A5D3', borderColor: "#8C5A3C", borderWidth: 1, padding: 5, alignItems: 'center', borderRadius: 999 },
  primaryButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: 'transparent', padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#8C5A3C', fontSize: 16, fontWeight: 'bold' },
});