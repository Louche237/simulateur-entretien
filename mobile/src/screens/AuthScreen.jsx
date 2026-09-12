import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api, storeToken, storeUser } from '../utils/api';

const AuthScreen = ({ navigation }) => {
  const [mode, setMode] = useState('login');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(true);
  const [warmupSuccess, setWarmupSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const warmup = async () => {
      try {
        await api.auth.warmup();
        if (!cancelled) setWarmupSuccess(true);
      } catch (e) {}
      if (!cancelled) setWarmingUp(false);
    };
    warmup();
    setTimeout(() => { if (!cancelled) setWarmingUp(false); }, 5000);
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    if (loading) return;

    if (mode === 'register' && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (mode === 'register' && (!prenom || !nom)) {
      Alert.alert('Erreur', 'Veuillez remplir vos noms');
      return;
    }

    setLoading(true);
    try {
      const payload = mode === 'register'
        ? { prenom, nom, email, password }
        : { email, password };
      const res = mode === 'login'
        ? await api.auth.login(payload)
        : await api.auth.register(payload);
      if (res.token) await storeToken(res.token);
      if (res.user) await storeUser(res.user);
      navigation.replace('AppTabs');
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>JM</Text>
            </View>
            <Text style={styles.title}>JobMentor</Text>
            <Text style={styles.subtitle}>Entraînez-vous. Progressez. Décrochez le poste.</Text>
          </View>

          {warmingUp && (
            <View style={styles.warmupBanner}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.warmupText}>
                {warmupSuccess ? 'Serveur prêt !' : 'Réveil du serveur en cours...'}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                  Connexion
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'register' && styles.tabActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                  Inscription
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'register' && (
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    value={prenom}
                    onChangeText={setPrenom}
                    placeholder="Jean"
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    value={nom}
                    onChangeText={setNom}
                    placeholder="Dupont"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {mode === 'register' && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  logoText: { color: '#fff', fontSize: fontSizes.xxl, fontWeight: 'bold' },
  title: { fontSize: fontSizes.xxxl, fontWeight: 'bold', color: colors.text },
  subtitle: {
    color: colors.textLight, marginTop: spacing.sm,
    textAlign: 'center', fontSize: fontSizes.md,
  },
  warmupBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md,
  },
  warmupText: { color: colors.primaryDark, fontSize: fontSizes.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  tabContainer: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: radius.md, marginBottom: spacing.lg, padding: 4,
  },
  tab: {
    flex: 1, padding: spacing.sm, alignItems: 'center', borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  tabText: { color: colors.textLight, fontSize: fontSizes.md, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  inputWrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4, fontSize: fontSizes.md,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', marginTop: spacing.sm, ...shadows.sm,
  },
  buttonDisabled: { backgroundColor: colors.primary + '80' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.lg },
});

export default AuthScreen;
