import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api } from '../utils/api';

const TABS = ['Analyse', 'CV Builder'];

const Badge = ({ text, color }) => (
  <View style={[styles.badge, { backgroundColor: (color || colors.primary) + '20' }]}>
    <Text style={[styles.badgeText, { color: color || colors.primary }]}>{text}</Text>
  </View>
);

const AnalyseCV = () => {
  const [tab, setTab] = useState(0);
  const [file, setFile] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [offer, setOffer] = useState('');
  const [lang, setLang] = useState('fr');
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const doc = res.assets[0];
      setFile({ name: doc.name, size: doc.size, uri: doc.uri });
      setExtracted(null);
      setAnalysis(null);
      const text = doc.name.endsWith('.txt')
        ? (await FileSystem.readAsStringAsync(doc.uri))
        : `[Contenu extrait de ${doc.name}]\n\nExemple de CV: Développeur React Node.js, 5 ans d'expérience, formation Ingénieur logiciel...`;
      const cv = await api.cv.extractFromText(text, doc.name);
      setExtracted(cv);
      Alert.alert('Succès', 'CV extrait avec succès !');
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible d\'importer le CV');
    }
  };

  const analyze = async () => {
    if (!extracted) {
      Alert.alert('Erreur', 'Importez un CV d\'abord');
      return;
    }
    if (!offer.trim()) {
      Alert.alert('Erreur', 'Saisissez l\'offre d\'emploi');
      return;
    }
    setLoading(true);
    try {
      const [a, ins] = await Promise.all([
        api.cv.analyze(extracted, offer, lang),
        api.cv.offerInsights(offer),
      ]);
      setAnalysis(a);
      setInsights(ins);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>📄 Analyse & Création de CV</Text>

        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, tab === i && styles.tabActive]}
              onPress={() => setTab(i)}
            >
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 0 && (
          <>
            <TouchableOpacity style={styles.dropzone} onPress={pickFile}>
              <Text style={{ fontSize: 40 }}>☁️</Text>
              <Text style={styles.dzTitle}>
                {file ? file.name : 'Importer un CV (PDF / DOC / DOCX)'}
              </Text>
              {file && (
                <Text style={styles.dzSubtitle}>
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </Text>
              )}
              <Text style={styles.dzBtn}>{file ? 'Changer' : 'Choisir un fichier'}</Text>
            </TouchableOpacity>

            {extracted && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>✅ CV extrait</Text>
                <Text style={styles.cvName}>
                  {extracted.personal?.name || extracted.personal?.fullName || 'N/A'}
                </Text>
                <Text style={styles.cvTitle}>{extracted.personal?.title || ''}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm }}>
                  {(extracted.skills || []).slice(0, 8).map((s, i) => (
                    <Badge key={i} text={typeof s === 'string' ? s : s.name} color={colors.secondary} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>💼 Offre d'emploi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={offer}
                onChangeText={setOffer}
                placeholder="Collez la description de l'offre..."
                multiline
                numberOfLines={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={analyze}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Analyse en cours...' : '🔍 Lancer l\'analyse'}
              </Text>
            </TouchableOpacity>

            {analysis && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>📊 Résultats</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Score de correspondance</Text>
                  <View style={[styles.scoreCircle, {
                    backgroundColor: (analysis.score > 70 ? colors.success : analysis.score > 40 ? colors.warning : colors.error) + '20',
                  }]}>
                    <Text style={[styles.scoreValue, {
                      color: analysis.score > 70 ? colors.success : analysis.score > 40 ? colors.warning : colors.error,
                    }]}>
                      {analysis.score ?? 0}%
                    </Text>
                  </View>
                </View>
                {insights && (
                  <View style={{ marginTop: spacing.md }}>
                    {insights.type && <Badge text={insights.type} color={colors.primary} />}
                    {insights.level && <Badge text={insights.level} color={colors.secondary} />}
                  </View>
                )}
                {analysis.strengths?.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.subLabel}>✓ Points forts</Text>
                    {analysis.strengths.map((s, i) => (
                      <Text key={i} style={styles.bulletText}>• {s}</Text>
                    ))}
                  </View>
                )}
                {analysis.improvements?.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.subLabel}>⚠ Axes d'amélioration</Text>
                    {analysis.improvements.map((s, i) => (
                      <Text key={i} style={styles.bulletText}>• {s}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {tab === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✏️ CV Builder</Text>
            <Text style={{ color: colors.textLight }}>
              Fonctionnalité bientôt disponible : créez votre CV directement dans l'application mobile !
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: spacing.lg }]}
              onPress={() => Alert.alert('Info', 'Version mobile en cours de développement 🔧')}
            >
              <Text style={styles.primaryBtnText}>Créer mon CV</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl + 40 },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: 'bold', marginBottom: spacing.lg },
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 4, marginBottom: spacing.md, ...shadows.sm,
  },
  tab: { flex: 1, padding: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary, ...shadows.sm },
  tabText: { color: colors.textLight, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  dropzone: {
    backgroundColor: colors.surface, borderWidth: 2, borderStyle: 'dashed',
    borderColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md,
  },
  dzTitle: { fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  dzSubtitle: { color: colors.textLight, marginTop: spacing.xs },
  dzBtn: {
    marginTop: spacing.md, backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4,
    borderRadius: radius.md, color: '#fff', fontWeight: '600', overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, ...shadows.md, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.md, color: colors.text,
  },
  cvName: { fontSize: fontSizes.xl, fontWeight: 'bold', color: colors.text },
  cvTitle: { color: colors.primary, marginVertical: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: fontSizes.md, backgroundColor: colors.surface,
  },
  textArea: { height: 160, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm,
    marginBottom: spacing.md, ...shadows.md,
  },
  btnDisabled: { backgroundColor: colors.primary + '80' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.lg },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  scoreLabel: { fontWeight: '600', color: colors.text, fontSize: fontSizes.lg },
  scoreCircle: {
    width: 80, height: 80, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreValue: { fontSize: fontSizes.xxl, fontWeight: 'bold' },
  subLabel: { fontWeight: '700', marginBottom: spacing.xs, color: colors.text },
  bulletText: { color: colors.textLight, marginBottom: spacing.xs, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.full,
    backgroundColor: colors.primary + '15',
  },
  badgeText: { fontSize: fontSizes.sm, fontWeight: '600' },
});

export default AnalyseCV;
