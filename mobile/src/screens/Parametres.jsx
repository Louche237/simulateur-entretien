import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Switch, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api, clearToken, clearUser, getUser, storeUser, getToken } from '../utils/api';

const Parametres = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [langue, setLangue] = useState('fr');
  const [notif, setNotif] = useState(true);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUser = async () => {
    const u = await getUser();
    if (u) {
      setUser(u);
      setPrenom(u.prenom || '');
      setNom(u.nom || '');
      setEmail(u.email || '');
      setLangue(u.langue || 'fr');
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadUser);
    return unsub;
  }, [navigation]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.user.updateProfile({ prenom, nom, email, langue });
      await storeUser(updated);
      setUser(updated);
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPw !== confirmPw) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      await api.user.updatePassword({ oldPassword: oldPw, newPassword: newPw });
      Alert.alert('Succès', 'Mot de passe modifié !');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui', onPress: async () => {
          await clearToken();
          await clearUser();
          navigation.replace('Auth');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>⚙️ Paramètres</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(prenom?.[0] || '?') + (nom?.[0] || '')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{prenom} {nom}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            {user?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>👑 Administrateur</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧑 Informations personnelles</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} />
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Langue</Text>
            <View style={styles.langRow}>
              {[
                { k: 'fr', l: '🇫🇷 Français' },
                { k: 'en', l: '🇬🇧 English' },
              ].map(l => (
                <TouchableOpacity
                  key={l.k}
                  style={[styles.langBtn, langue === l.k && styles.langBtnOn]}
                  onPress={() => setLangue(l.k)}
                >
                  <Text style={[styles.langText, langue === l.k && styles.langTextOn]}>
                    {l.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>Notifications</Text>
              <Text style={styles.helpText}>Rappels d'entraînement</Text>
            </View>
            <Switch value={notif} onValueChange={setNotif} />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={saveProfile}
            disabled={saving}
          >
            <Text style={styles.primaryBtnText}>Enregistrer le profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔐 Mot de passe</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput style={styles.input} value={oldPw} onChangeText={setOldPw} secureTextEntry />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} value={newPw} onChangeText={setNewPw} secureTextEntry />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirmer</Text>
            <TextInput style={styles.input} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
          </View>
          <TouchableOpacity
            style={[styles.secondaryBtn, saving && styles.btnDisabled]}
            onPress={changePassword}
            disabled={saving}
          >
            <Text style={styles.secondaryBtnText}>Modifier le mot de passe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ℹ️ À propos</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application</Text>
            <Text style={styles.infoValue}>JobMentor Mobile</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl + 40 },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: 'bold', marginBottom: spacing.lg },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.lg,
    borderRadius: radius.xl, marginBottom: spacing.md, ...shadows.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: radius.full,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: fontSizes.xl },
  profileName: { fontSize: fontSizes.xl, fontWeight: 'bold', color: colors.text },
  profileEmail: { color: colors.textLight, marginTop: 2 },
  adminBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm + 2, paddingVertical: 2,
    borderRadius: radius.sm, marginTop: spacing.sm,
  },
  adminBadgeText: { color: '#92400e', fontWeight: '600', fontSize: fontSizes.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md, ...shadows.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.md, color: colors.text,
  },
  inputWrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  helpText: { color: colors.textLight, fontSize: fontSizes.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: fontSizes.md, backgroundColor: colors.surface,
  },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  langBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontWeight: '600', color: colors.text },
  langTextOn: { color: '#fff' },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', ...shadows.sm,
  },
  secondaryBtn: {
    backgroundColor: colors.secondary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', ...shadows.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textLight },
  infoValue: { fontWeight: '600' },
  logoutBtn: {
    backgroundColor: colors.error + '15',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutText: { color: colors.error, fontWeight: '700' },
});

export default Parametres;
