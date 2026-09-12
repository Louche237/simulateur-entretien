import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSizes, shadows } from '../theme';
import { api } from '../utils/api';

const Entretien = ({ route, navigation }) => {
  const { sessionId, config } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const scrollRef = useRef();

  const addMessage = (role, text, meta) => {
    setMessages(prev => [...prev, { role, text, meta, id: Date.now() + Math.random() }]);
  };

  useEffect(() => {
    addMessage('recruteur', `Bonjour ! Je m'appelle ${config?.recruteur || "l'intervieweur"} et nous allons parler du poste de ${config?.poste || 'votre poste'}. Êtes-vous prêt ?`);
  }, []);

  const sendAnswer = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    addMessage('candidat', text);
    setInput('');
    setLoading(true);
    try {
      const lastMessages = messages.slice(-10).map(m => ({
        role: m.role === 'candidat' ? 'user' : 'assistant',
        content: m.text,
      }));
      const res = await api.simulation.evaluateAnswer({
        sessionId,
        messages: lastMessages,
        answer: text,
        config,
      });
      if (res.feedback) addMessage('recruteur', res.feedback + (res.nextQuestion ? `\n\n${res.nextQuestion}` : ''));
      if (typeof res.score === 'number') setScore(res.score);
    } catch (err) {
      addMessage('recruteur', `Erreur: ${err.message}. Essayez de répondre à nouveau.`);
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    setLoading(true);
    try {
      const res = await api.simulation.finalizeInterview({ sessionId, messages, config });
      if (res.score) setScore(res.score);
      Alert.alert('Entretien terminé', `Score : ${res.score || 0}/100\n${res.summary || 'Merci pour votre participation !'}`);
      navigation.navigate('Historique');
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{config?.poste || 'Entretien'}</Text>
          <Text style={styles.headerSubtitle}>
            {config?.recruteur || 'Recruteur'} · {config?.duree || 20}min
          </Text>
        </View>
        {score !== null && (
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>{score}%</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd?.()}
        style={{ flex: 1 }}
        contentContainerStyle={styles.chatContainer}
      >
        {messages.map(m => (
          <View key={m.id} style={[
            styles.messageWrapper,
            m.role === 'candidat' ? styles.msgRight : styles.msgLeft,
          ]}>
            <View style={[
              styles.messageBubble,
              m.role === 'candidat' ? styles.bubbleUser : styles.bubbleRecruteur,
            ]}>
              <Text style={[
                styles.messageText,
                m.role === 'candidat' ? { color: '#fff' } : { color: colors.text },
              ]}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageWrapper, styles.msgLeft]}>
            <View style={[styles.messageBubble, styles.bubbleRecruteur]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            value={input}
            onChangeText={setInput}
            placeholder="Tapez votre réponse..."
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, loading && { opacity: 0.5 }]}
            onPress={sendAnswer}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={finishInterview}
          disabled={loading}
        >
          <Text style={styles.finishText}>Terminer l'entretien</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  backBtn: { fontSize: 24, fontWeight: 'bold', color: colors.primary, padding: spacing.sm },
  headerTitle: { fontWeight: 'bold', fontSize: fontSizes.lg, color: colors.text },
  headerSubtitle: { color: colors.textLight, fontSize: fontSizes.sm },
  scorePill: {
    backgroundColor: colors.success, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  scoreText: { color: '#fff', fontWeight: '700' },
  chatContainer: { padding: spacing.md, paddingBottom: spacing.xl },
  messageWrapper: { width: '100%', marginBottom: spacing.md },
  msgLeft: { alignItems: 'flex-start' },
  msgRight: { alignItems: 'flex-end' },
  messageBubble: {
    maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg,
    ...shadows.sm,
  },
  bubbleRecruteur: { backgroundColor: colors.surface, borderBottomLeftRadius: radius.sm },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  messageText: { fontSize: fontSizes.md },
  inputRow: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  chatInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 120, backgroundColor: colors.background,
  },
  sendBtn: {
    backgroundColor: colors.primary, width: 48, height: 48,
    borderRadius: radius.full, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-end', ...shadows.sm,
  },
  finishBtn: {
    backgroundColor: colors.accent, margin: spacing.md,
    marginTop: 0, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center',
  },
  finishText: { color: '#fff', fontWeight: '700' },
});

export default Entretien;
