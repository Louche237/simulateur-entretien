import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api, clearToken, clearUser, getUser } from '../utils/api';

const StatCard = ({ label, value, color, icon }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const Dashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [u, s] = await Promise.all([getUser(), api.user.getStats().catch(() => null)]);
      setUser(u);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          await clearToken();
          await clearUser();
          navigation.replace('Auth');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const quickActions = [
    { label: 'Simulation', icon: '🎙️', screen: 'Simulation', color: colors.primary },
    { label: 'Analyse CV', icon: '📄', screen: 'AnalyseCV', color: colors.secondary },
    { label: 'CV Builder', icon: '✏️', screen: 'Simulation', color: colors.accent },
    { label: 'Historique', icon: '📜', screen: 'Historique', color: colors.success },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.userName}>
              {user?.prenom ? `${user.prenom} ${user.nom || ''}` : 'Utilisateur'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={{ fontSize: 20 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progression globale</Text>
          <Text style={styles.progressScore}>{stats?.scoreMoyen ?? 0}%</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, stats?.scoreMoyen ?? 0)}%` },
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Sessions" value={stats?.totalSessions ?? 0} color={colors.primary} icon="🎯" />
          <StatCard label="Terminées" value={stats?.sessionsTerminees ?? 0} color={colors.success} icon="✅" />
          <StatCard label="Score moyen" value={`${stats?.scoreMoyen ?? 0}%`} color={colors.warning} icon="📊" />
          <StatCard label="En cours" value={stats?.sessionsEnCours ?? 0} color={colors.accent} icon="⏳" />
        </View>

        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickAction, { borderTopColor: a.color }]}
              onPress={() => navigation.navigate(a.screen)}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + '15' }]}>
                <Text style={{ fontSize: 28 }}>{a.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: fontSizes.md, color: colors.textLight },
  userName: { fontSize: fontSizes.xxl, fontWeight: 'bold', color: colors.text },
  logoutBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', ...shadows.sm,
  },
  progressCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl, padding: spacing.lg,
    ...shadows.lg, marginBottom: spacing.lg,
  },
  progressTitle: { color: '#ffffffcc', fontSize: fontSizes.md },
  progressScore: { color: '#fff', fontSize: fontSizes.xxxl, fontWeight: 'bold', marginVertical: spacing.xs },
  progressBarBg: { height: 8, backgroundColor: '#ffffff40', borderRadius: radius.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: radius.full },
  sectionTitle: { fontSize: fontSizes.xl, fontWeight: 'bold', marginVertical: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    width: '48%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, ...shadows.sm, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  statValue: { fontSize: fontSizes.xl, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: fontSizes.sm, color: colors.textLight },
  quickActionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.md, marginBottom: spacing.xl,
  },
  quickAction: {
    width: '48%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', borderTopWidth: 4, ...shadows.sm,
  },
  quickIcon: {
    width: 64, height: 64, borderRadius: radius.xl,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  quickLabel: { fontWeight: '700', fontSize: fontSizes.md, color: colors.text },
});

export default Dashboard;
