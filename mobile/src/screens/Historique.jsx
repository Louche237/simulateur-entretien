import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api } from '../utils/api';

const statusColor = (status) => status === 'terminee' ? colors.success : colors.warning;
const statusLabel = (status) => status === 'terminee' ? 'Terminée' : 'En cours';

const Historique = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.sessions.getAll();
      setSessions(Array.isArray(s) ? s : []);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const exportJSON = async () => {
    try {
      const json = JSON.stringify(sessions, null, 2);
      const html = `
        <html><head><style>
          body{font-family:sans-serif;padding:24px;color:#1e293b}
          h1{color:#3742fa}
          .session{border:1px solid #e2e8f0;padding:16px;margin:12px 0;border-radius:12px}
          .score{font-size:32px;font-weight:bold;color:#10ac84}
        </style></head><body>
        <h1>Historique des sessions JobMentor</h1>
        <p>Total: ${sessions.length} session(s)</p>
        ${sessions.map(s => `
          <div class="session">
            <h2>${s.poste || 'Session'} ${s.entreprise ? `- ${s.entreprise}` : ''}</h2>
            <p><strong>Type:</strong> ${s.type || 'N/A'} |
            <strong>Niveau:</strong> ${s.niveau || 'N/A'} |
            <strong>Status:</strong> ${statusLabel(s.status)}</p>
            <div class="score">Score: ${s.score ?? 'N/A'}/100</div>
            <p><em>${new Date(s.createdAt).toLocaleString('fr-FR')}</em></p>
          </div>
        `).join('')}
        </body></html>`;
      const res = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, { mimeType: 'application/pdf', dialogTitle: 'Exporter historique' });
      } else {
        Alert.alert('Succès', `PDF généré: ${res.uri}`);
      }
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>📜 Historique</Text>
          <Text style={styles.pageSubtitle}>
            {sessions.length} session(s) enregistrée(s)
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={exportJSON}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>⬇ Exporter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyTitle}>Pas encore de sessions</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Simulation')}
            >
              <Text style={styles.primaryBtnText}>Commencer un entretien</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => Alert.alert(
              'Détails',
              `Poste: ${item.poste || 'N/A'}\nEntreprise: ${item.entreprise || 'N/A'}\nScore: ${item.score ?? 'N/A'}/100\nStatus: ${statusLabel(item.status)}\nDate: ${new Date(item.createdAt).toLocaleString('fr-FR')}`
            )}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionPoste}>
                {item.poste || 'Session'} {item.entreprise ? `· ${item.entreprise}` : ''}
              </Text>
              <Text style={styles.sessionMeta}>
                {item.type || 'Entretien'} · {item.niveau || 'N/A'} ·
                {item.duree || 0}min
              </Text>
              <Text style={styles.sessionDate}>
                {new Date(item.createdAt).toLocaleString('fr-FR')}
              </Text>
              <View style={styles.sessionTags}>
                <View style={[
                  styles.statusPill, { backgroundColor: statusColor(item.status) + '20' }
                ]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[
              styles.scoreBox, {
                backgroundColor: (item.score >= 70
                  ? colors.success
                  : item.score >= 40
                    ? colors.warning
                    : colors.error) + '20',
              }
            ]}>
              <Text style={[
                styles.scoreText, {
                  color: item.score >= 70
                    ? colors.success
                    : item.score >= 40
                      ? colors.warning
                      : colors.error,
                }
              ]}>
                {item.score ?? '-'}
              </Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.md,
  },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: 'bold' },
  pageSubtitle: { color: colors.textLight, marginTop: 2 },
  exportBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  empty: { alignItems: 'center', padding: spacing.xl * 2 },
  emptyTitle: { fontSize: fontSizes.lg, color: colors.textLight, marginVertical: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  sessionCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    ...shadows.sm,
  },
  sessionPoste: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.text },
  sessionMeta: { color: colors.textLight, marginTop: 2 },
  sessionDate: { color: colors.textLight, fontSize: fontSizes.sm, marginTop: 4 },
  sessionTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md,
    paddingVertical: 2, borderRadius: radius.full,
  },
  statusText: { fontSize: fontSizes.sm, fontWeight: '600' },
  scoreBox: {
    width: 72, height: 72, borderRadius: radius.lg,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
  },
  scoreText: { fontSize: 28, fontWeight: 'bold' },
  scorePercent: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.textLight },
});

export default Historique;
