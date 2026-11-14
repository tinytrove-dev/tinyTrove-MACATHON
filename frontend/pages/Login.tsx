import React, { useRef, useState } from 'react';
import {
  View, Image, Text, TextInput, Alert, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, Keyboard,
} from 'react-native';
import { authApi } from '../lib/authApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardScroll } from '../lib/useKeyboardScroll';

type FieldKey = 'username' | 'displayName' | 'email' | 'password' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldKey, string>>;
type InputRef = React.ComponentRef<typeof TextInput>;

// Top-to-bottom order of the sign-up form. The first wrong field is the one we jump to.
const SIGN_UP_ORDER: FieldKey[] = ['username', 'displayName', 'email', 'password', 'confirmPassword'];

// Word that shows up in a server error when that field is the problem
const FIELD_WORDS: Record<FieldKey, string> = {
  username: 'username',
  displayName: 'display',
  email: 'email',
  password: 'password',
  confirmPassword: 'confirm',
};

const MIN_PASSWORD_LENGTH = 6;

const PASSWORD_RULES: { test: (p: string) => boolean; message: string }[] = [
  { test: (p) => p.length >= MIN_PASSWORD_LENGTH, message: `at least ${MIN_PASSWORD_LENGTH} characters` },
  { test: (p) => /[A-Z]/.test(p), message: 'an uppercase letter' },
  { test: (p) => /[a-z]/.test(p), message: 'a lowercase letter' },
  { test: (p) => /[0-9]/.test(p), message: 'a number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), message: 'a special character (like ! @ # $)' },
];

function checkEmail(value: string): string | undefined {
  if (!value.trim()) return 'Enter your email';
  if (!/^\S+@\S+\.\S+$/.test(value.trim())) return "Please enter a valif email address";
  return undefined;
}

function Field({ label, error, inputRef, ...inputProps }: any) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#A88B78"
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggles between Login and Sign Up

  const usernameRef = useRef<InputRef>(null);
  const displayNameRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const confirmPasswordRef = useRef<InputRef>(null);
  const inputRefs: Record<FieldKey, React.RefObject<InputRef | null>> = {
    username: usernameRef,
    displayName: displayNameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  // Keeps the focused field above the keyboard and lets the form scroll past it
  const { scrollRef, onScroll, keyboardPadding, scrollToInput } = useKeyboardScroll();

  function clearError(key: FieldKey) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function jumpTo(key: FieldKey) {
    inputRefs[key].current?.focus();
  }

  function validateSignUp(): FieldErrors {
    const found: FieldErrors = {};
    if (!username.trim()) found.username = 'Enter a username';
    if (!displayName.trim()) found.displayName = 'Enter a display name';
    const emailProblem = checkEmail(email);
    if (emailProblem) found.email = emailProblem;
    const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.message);
    if (missing.length > 0) {
      found.password = `Password needs ${missing.join(', ')}`;
    }
    if (!confirmPassword) {
      found.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      found.confirmPassword = "Passwords don't match";
    }
    return found;
  }

  async function signInWithEmail() {
    const emailProblem = checkEmail(email);
    setErrors(emailProblem ? { email: emailProblem } : {});
    if (emailProblem) {
      jumpTo('email');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.signIn(email, password);
      Alert.alert('Success', 'You are signed in!');
      onLoginSuccess(response.user);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    const found = validateSignUp();
    setErrors(found);
    const firstWrong = SIGN_UP_ORDER.find((key) => found[key]);
    if (firstWrong) {
      jumpTo(firstWrong);
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.signUp(email, password, username, displayName);
      Alert.alert('Success', 'Welcome to tinyTrove! Check your email for verification.');
      onLoginSuccess(response.user);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      const lower = String(message).toLowerCase();
      const serverField = SIGN_UP_ORDER.find((key) => lower.includes(FIELD_WORDS[key]));
      if (serverField) {
        setErrors({ [serverField]: message } as FieldErrors);
        jumpTo(serverField);
      }
      Alert.alert('Error', message);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.container, { paddingBottom: 32 + keyboardPadding }]}
          keyboardShouldPersistTaps="handled"
        >
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
                <Field
                  label="Username"
                  inputRef={usernameRef}
                  onFocus={() => scrollToInput(usernameRef)}
                  error={errors.username}
                  placeholder="e.g. John Bob"
                  value={username}
                  onChangeText={(text: string) => { setUsername(text); clearError('username'); }}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Field
                  label="Display name"
                  inputRef={displayNameRef}
                  onFocus={() => scrollToInput(displayNameRef)}
                  error={errors.displayName}
                  placeholder="e.g. Sanrio Fan"
                  value={displayName}
                  onChangeText={(text: string) => { setDisplayName(text); clearError('displayName'); }}
                  editable={!loading}
                />
              </>
            )}

            <Field
              label="Email"
              inputRef={emailRef}
              onFocus={() => scrollToInput(emailRef)}
              error={errors.email}
              placeholder="name@example.com"
              value={email}
              onChangeText={(text: string) => { setEmail(text); clearError('email'); }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <Field
              label="Password"
              inputRef={passwordRef}
              onFocus={() => scrollToInput(passwordRef)}
              error={errors.password}
              value={password}
              onChangeText={(text: string) => { setPassword(text); clearError('password'); }}
              secureTextEntry
              editable={!loading}
            />
            {isSignUp && (
              <Field
                label="Confirm password"
                inputRef={confirmPasswordRef}
                onFocus={() => scrollToInput(confirmPasswordRef)}
                error={errors.confirmPassword}
                value={confirmPassword}
                onChangeText={(text: string) => { setConfirmPassword(text); clearError('confirmPassword'); }}
                secureTextEntry
                editable={!loading}
              />
            )}
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
              onPress={() => { setIsSignUp(!isSignUp); setErrors({}); }} // Toggles the form mode
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFD09A' },
  container: { flexGrow: 1, backgroundColor: '#FFD09A', padding: 20, paddingBottom: 32 },
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 42, fontWeight: 'bold', color: '#8C5A3C' },
  subtitle: { fontSize: 16, color: '#8C5A3C', marginTop: 8 },
  inputContainer: { gap: 12, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#8C5A3C', marginLeft: 14, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#8C5A3C',
    backgroundColor: '#FFF8F0',
    color: '#2A211D',
    borderRadius: 999,
    paddingHorizontal: 14,
    fontSize: 16,
    height: 44,
  },
  inputError: { borderColor: '#C62828', borderWidth: 2, backgroundColor: '#FFF0EE' },
  errorText: { color: '#C62828', fontSize: 13, marginTop: 4, marginLeft: 14 },
  buttonContainer: { gap: 12, color: '#8C5A3C' },
  primaryButton: { backgroundColor: '#71A5D3', borderColor: "#8C5A3C", borderWidth: 1, padding: 5, alignItems: 'center', borderRadius: 999 },
  primaryButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: 'transparent', padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#8C5A3C', fontSize: 16, fontWeight: 'bold' },
});
