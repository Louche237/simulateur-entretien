import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api } from '../utils/api';

const RECRUTEURS = [
  { label: 'Aria (Empathique)', value: 'aria' },
  { label: 'Guillaume (Direct)', value: 'guillaume' },
  { label: 'Sophie (Stress)', value: 'sophie' },
  { label: 'Thomas (Expert)', value: 'thomas' },
];

const NIVEAUX = [
  { label: 'Débutant', value: 'debutant' },
  { label: 'Intermédiaire', value: 'intermediaire' },
  { label: 'Avancé', value: 'avance' },
];

const DIFFICULTES = [
  { label: 'Facile', value: 'facile' },
  { label: 'Normal', value: 'normal' },
  { label: 'Difficile', value: 'difficile' },
];

const DUREES = [
  { label: '10 minutes', value: 10 },
  { label: '20 minutes', value: 20 },
  { label: '30 minutes', value: 30 },
];

const TYPES = [
  { label: 'RH', value: 'rh' },
  { label: 'Technique', value: 'technique' },
  { label: 'Comportemental', value: 'comportemental' },
  { label: 'Direction', value: 'direction' },
];

const Simulation = ({ navigation }) => {
  const [poste, setPoste] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [description, setDescription] = useState('');
  const [recruteur, setRecruteur] = useState('aria');
  const [niveau, setNiveau] = useState('intermediaire');
  const [difficulte, setDifficulte] = useState('normal');
  const [duree, setDuree] = useState(20);
  const [type, setType] = useState('technique');
  const [surprises, setSurprises] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!poste) {
      Alert.alert('Erreur', 'Veuillez saisir le poste visé');
      return;
    }
    setLoading(true);
    try {
      const session = await api.sessions.create({
        poste, entreprise, description,
        niveau, difficulte, recruteur, duree,
        type, surprises,
      });
      Alert.alert('Succès', 'Session créée ! Bon entretien !');
      navigation.navigate('Entretien', { sessionId: session.id, config: session });
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickerSelect = (items, value, onChange, placeholder) => (
    <View style={styles.pickerWrapper}>
      <RNPickerSelect
        items={items}
        value={value}
        onValueChange={onChange}
        placeholder={{ label: placeholder, value: null }}
        style={{
          inputIOS: styles.picker,
          inputAndroid: styles.picker,
          placeholder: { color: colors.textLight },
        }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Nouvelle simulation</Text>
        <Text style={styles.pageSubtitle}>
          Paramétrez votre entretien virtuel et démarrez !
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Informations du poste</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Poste visé *</Text>
            <TextInput
              style={styles.input}
              value={poste}
              onChangeText={setPoste}
              placeholder="Développeur Full-Stack"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Entreprise (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={entreprise}
              onChangeText={setEntreprise}
              placeholder="Nom de l'entreprise"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Description de l'offre</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Collez la description de l'offre..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              {pickerSelect(TYPES, type, (v) => v && setType(v), 'Type')}
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Niveau</Text>
              {pickerSelect(NIVEAUX, niveau, (v) => v && setNiveau(v), 'Niveau')}
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Difficulté</Text>
              {pickerSelect(DIFFICULTES, difficulte, (v) => v && setDifficulte(v), 'Difficulté')}
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Durée</Text>
              {pickerSelect(DUREES, duree, (v) => v && setDuree(v), 'Durée')}
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Recruteur</Text>
            {pickerSelect(RECRUTEURS, recruteur, (v) => v && setRecruteur(v), 'Recruteur')}
          </View>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setSurprises(!surprises)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Questions surprises</Text>
              <Text style={styles.toggleHint}>
                Questions inattendues pendant l'entretien
              </Text>
            </View>
            <View style={[styles.toggle, surprises && styles.toggleOn]}>
              <View style={[styles.toggleKnob, surprises && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startButton, loading && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={loading}
        >
          <Text style={styles.startButtonText}>
            {loading ? 'Démarrage...' : '🚀 Démarrer l\'entretien'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl + 40 },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: 'bold', color: colors.text },
  pageSubtitle: { color: colors.textLight, marginBottom: spacing.lg, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, ...shadows.md, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.md,
    color: colors.text,
  },
  inputWrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: fontSizes.md, backgroundColor: colors.surface,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  pickerWrapper: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surface, overflow: 'hidden',
  },
  picker: {
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: fontSizes.md,
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.md,
  },
  toggleLabel: { fontWeight: '600', color: colors.text, fontSize: fontSizes.md },
  toggleHint: { color: colors.textLight, fontSize: fontSizes.sm, marginTop: 2 },
  toggle: {
    width: 50, height: 28, borderRadius: radius.full,
    backgroundColor: colors.border, padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  toggleKnob: {
    width: 22, height: 22, borderRadius: radius.full, backgroundColor: '#fff',
    ...shadows.sm,
  },
  toggleKnobOn: { transform: [{ translateX: 22 }] },
  startButton: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm, ...shadows.md,
  },
  buttonDisabled: { backgroundColor: colors.primary + '80' },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.lg },
});

export default Simulation;
