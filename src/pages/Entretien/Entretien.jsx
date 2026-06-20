import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  finishLocalSession,
  getActiveSessionId,
  getLocalSession,
  upsertLocalSession,
  updateLocalSession,
} from "../../utils/localSessions";
import { sessionAPI } from "../../utils/api";
import styles from "./Entretien.module.css";

const ICONS = {
  mic: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  arrowLeft: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrowRight: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  spark: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  replay: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-8.32L1 10"/></svg>,
  sound: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  soundOff: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
};

const COPY = {
  fr: {
    loadingTitle: "Chargement de la session",
    loadingSubtitle: "Nous récupérons les questions de votre entretien.",
    emptyTitle: "Aucune session active",
    emptySubtitle: "Configurez d'abord un entretien pour générer vos questions.",
    emptyBack: "Revenir à la configuration",
    finishedTitle: "Entretien terminé",
    history: "Voir l'historique",
    newInterview: "Nouvel entretien",
    eyebrow: "Simulation entretien",
    answered: "réponse(s) enregistrée(s)",
    question: "Question",
    previous: "Précédente",
    next: "Suivante",
    finish: "Terminer",
    finishing: "Finalisation...",
    analyze: "Analyser la réponse",
    analyzing: "Analyse IA...",
    replay: "Rejouer la question",
    listenStart: "Répondre à l'oral",
    listenStop: "Arrêter l'écoute",
    listening: "Écoute en cours...",
    voiceCaptured: "Réponse vocale capturée.",
    voiceUnavailable: "La reconnaissance vocale n'est pas disponible dans ce navigateur.",
    voiceReady: "Prêt pour la dictée vocale.",
    voiceOn: "Interviewer vocal",
    answerPlaceholder: "Écrivez votre réponse ou utilisez la dictée vocale.",
    interviewEnded: "Session terminée",
    resultScore: "Score",
    resultAnswered: "Questions répondues",
    resultPoste: "Poste",
    resultDuration: "Durée cible",
    analysisTitle: "Analyse IA de la réponse",
    strengths: "Points forts",
    improvements: "À améliorer",
    followUp: "Relance suggérée",
    rewritten: "Version retravaillée",
    clarity: "Clarté",
    relevance: "Pertinence",
    structure: "Structure",
    confidence: "Confiance",
  },
  en: {
    loadingTitle: "Loading session",
    loadingSubtitle: "We are fetching your interview questions.",
    emptyTitle: "No active session",
    emptySubtitle: "Set up an interview first to generate questions.",
    emptyBack: "Back to setup",
    finishedTitle: "Interview completed",
    history: "View history",
    newInterview: "New interview",
    eyebrow: "Interview simulation",
    answered: "saved answer(s)",
    question: "Question",
    previous: "Previous",
    next: "Next",
    finish: "Finish",
    finishing: "Finishing...",
    analyze: "Analyze answer",
    analyzing: "AI analysis...",
    replay: "Replay question",
    listenStart: "Answer with voice",
    listenStop: "Stop listening",
    listening: "Listening...",
    voiceCaptured: "Voice answer captured.",
    voiceUnavailable: "Speech recognition is not available in this browser.",
    voiceReady: "Ready for voice dictation.",
    voiceOn: "Voice interviewer",
    answerPlaceholder: "Type your answer or use voice dictation.",
    interviewEnded: "Session completed",
    resultScore: "Score",
    resultAnswered: "Questions answered",
    resultPoste: "Role",
    resultDuration: "Target duration",
    analysisTitle: "AI answer analysis",
    strengths: "Strengths",
    improvements: "Needs improvement",
    followUp: "Suggested follow-up",
    rewritten: "Reworked version",
    clarity: "Clarity",
    relevance: "Relevance",
    structure: "Structure",
    confidence: "Confidence",
  },
};

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

const buildLocalAnswerReview = ({ answer, language }) => {
  const content = String(answer || "").trim();
  const isEnglish = language === "en";

  if (!content) {
    return {
      score: 0,
      clarity: 0,
      relevance: 0,
      structure: 0,
      confidence: 0,
      summary: isEnglish ? "No answer provided." : "Réponse non renseignée.",
      strengths: [isEnglish ? "No content provided" : "Aucun contenu saisi"],
      improvements: [
        isEnglish ? "Write a complete answer" : "Rédigez une réponse complète",
        isEnglish ? "Add a concrete example" : "Ajoutez un exemple concret",
      ],
      followUpQuestion: isEnglish
        ? "Could you give a concrete example?"
        : "Pouvez-vous donner un exemple concret ?",
      rewrittenAnswer: isEnglish
        ? "Use the STAR method: situation, task, action, result."
        : "Structurez votre réponse avec la méthode STAR: situation, tâche, action, résultat.",
      verdict: "weak",
    };
  }

  const structureMarkers = isEnglish
    ? /first|then|next|finally|for example|concretely|in short|as a result/i
    : /d'abord|ensuite|puis|enfin|par exemple|concrètement|en bref|au final/i;
  const confidenceMarkers = isEnglish
    ? /i think|i believe|i know|i can|i have|i managed|i led/i
    : /je pense|je crois|je sais|j'ai|je peux|j'ai mené|j'ai géré/i;
  const outcomeMarkers = isEnglish
    ? /result|impact|improved|delivered|success|saved|increased/i
    : /résultat|impact|amélior|livré|succès|gagné|augment/i;

  const lengthScore = Math.min(35, Math.round(content.length / 10));
  const structureScore = structureMarkers.test(content) ? 20 : 8;
  const relevanceScore = content.length > 80 ? 25 : content.length > 30 ? 18 : 8;
  const confidenceScore = confidenceMarkers.test(content) ? 15 : 8;
  const outcomeScore = outcomeMarkers.test(content) ? 10 : 0;
  const score = Math.min(100, lengthScore + structureScore + relevanceScore + confidenceScore + outcomeScore);

  const verdict = score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "weak";

  return {
    score,
    clarity: Math.min(100, score - 5),
    relevance: Math.min(100, relevanceScore * 4),
    structure: Math.min(100, structureScore * 4),
    confidence: Math.min(100, confidenceScore * 6),
    summary: isEnglish
      ? "The answer is understandable, but it would benefit from more structure and concrete evidence."
      : "Réponse cohérente, mais elle gagnerait à être plus structurée et plus illustrée.",
    strengths: isEnglish
      ? ["The answer is engaged", "The topic is addressed"]
      : ["La réponse est engagée", "Le sujet est traité"],
    improvements: isEnglish
      ? ["Add a concrete example", "End with measurable impact"]
      : ["Ajoutez un exemple concret", "Concluez par un impact mesurable"],
    followUpQuestion: isEnglish
      ? "Could you give a concrete example?"
      : "Pouvez-vous donner un exemple concret ?",
    rewrittenAnswer: isEnglish
      ? "Use the STAR method: situation, task, action, result."
      : "Structurez votre réponse avec la méthode STAR: situation, tâche, action, résultat.",
    verdict,
  };
};

export default function Entretien() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSessionId = location.state?.sessionId || getActiveSessionId();
  const [session, setSession] = useState(() => getLocalSession(initialSessionId));
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState((session?.duree || 10) * 60);
  const [loadingSession, setLoadingSession] = useState(Boolean(initialSessionId && !session));
  const [finishing, setFinishing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const sessionRef = useRef(session);
  const finishingRef = useRef(finishing);
  const recognitionRef = useRef(null);

  const currentQuestion = session?.questions?.[current] || null;
  const currentQuestionText = currentQuestion?.text || "";
  const sessionId = session?.id || "";
  const language = session?.langue === "en" ? "en" : "fr";
  const copy = COPY[language] || COPY.fr;
  const speechLang = language === "en" ? "en-US" : "fr-FR";
  const displayedVoiceStatus = voiceStatus || (!speechSupported ? copy.voiceUnavailable : "");

  const answeredCount = useMemo(
    () => session?.questions?.filter((question) => String(question.answer || "").trim()).length || 0,
    [session]
  );

  const progress = session && session.questions?.length
    ? Math.round(((current + 1) / session.questions.length) * 100)
    : 0;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    finishingRef.current = finishing;
  }, [finishing]);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setListening(false);
    setSpeaking(false);
  }, []);

  const speakQuestion = useCallback(
    (text) => {
      if (typeof window === "undefined" || !window.speechSynthesis || !text) return;

      stopVoice();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 0.98;
      utterance.pitch = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      const voices = window.speechSynthesis.getVoices();
      const languagePrefix = speechLang.slice(0, 2).toLowerCase();
      const voice =
        voices.find((entry) => entry.lang?.toLowerCase().startsWith(speechLang.toLowerCase())) ||
        voices.find((entry) => entry.lang?.toLowerCase().startsWith(languagePrefix)) ||
        voices.find((entry) => entry.default) ||
        voices[0];

      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    },
    [speechLang, stopVoice]
  );

  const updateAnswer = useCallback(
    (updater) => {
      const currentSession = sessionRef.current;
      const question = currentSession?.questions?.[current];
      if (!currentSession || !question) return null;

      const nextAnswer =
        typeof updater === "function"
          ? updater(String(question.answer || ""))
          : String(updater || "");

      const updated = updateLocalSession(currentSession.id, (draft) => ({
        ...draft,
        questions: draft.questions.map((entry, index) =>
          index === current ? { ...entry, answer: nextAnswer } : entry
        ),
      }));

      setSession(updated);
      return nextAnswer;
    },
    [current]
  );

  const persistAnswer = useCallback(
    async (answerText) => {
      const currentSession = sessionRef.current;
      const question = currentSession?.questions?.[current];
      if (!currentSession || !question) return null;

      const trimmedAnswer = String(answerText || "").trim();
      const sessionLanguage = currentSession.langue === "en" ? "en" : "fr";
      const analysis = buildLocalAnswerReview({
        answer: trimmedAnswer,
        language: sessionLanguage,
      });

      const updated = updateLocalSession(currentSession.id, (draft) => ({
        ...draft,
        questions: draft.questions.map((entry, index) =>
          index === current ? { ...entry, answer: trimmedAnswer, analysis } : entry
        ),
      }));
      setSession(updated);

      if (currentSession.id.startsWith("local-")) {
        return updated;
      }

      setAnalyzing(true);
      try {
        const remote = await sessionAPI.soumettreReponse(currentSession.id, {
          questionId: question.id,
          questionIndex: current,
          answer: trimmedAnswer,
        });

        if (remote.success && remote.session) {
          upsertLocalSession(remote.session);
          setSession(remote.session);
          return remote.session;
        }
      } finally {
        setAnalyzing(false);
      }

      return updated;
    },
    [current]
  );

  useEffect(() => {
    let mounted = true;

    const loadRemoteSession = async () => {
      if (session || !initialSessionId) return;

      const remote = await sessionAPI.getUne(initialSessionId);
      if (!mounted) return;

      if (remote.success && remote.session) {
        upsertLocalSession(remote.session);
        setSession(remote.session);
        setSecondsLeft((remote.session.duree || 10) * 60);
      }

      setLoadingSession(false);
    };

    loadRemoteSession();

    return () => {
      mounted = false;
    };
  }, [initialSessionId, session]);

  useEffect(() => {
    if (!sessionId || !currentQuestionText) return undefined;

    const timeout = window.setTimeout(() => {
      speakQuestion(currentQuestionText);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      stopVoice();
    };
  }, [currentQuestionText, sessionId, speakQuestion, stopVoice]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return undefined;
    }
    const recognition = new Recognition();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus(copy.listening);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript || "";
      }

      const cleanTranscript = transcript.trim();
      if (!cleanTranscript) return;

      updateAnswer((previous) => [previous.trim(), cleanTranscript].filter(Boolean).join(" ").trim());
      setVoiceStatus(copy.voiceCaptured);
    };

    recognition.onerror = (event) => {
      setListening(false);
      setVoiceStatus(event?.error ? `${copy.voiceUnavailable} (${event.error})` : copy.voiceUnavailable);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [copy.listening, copy.voiceCaptured, copy.voiceUnavailable, speechLang, updateAnswer]);

  const completeSession = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession || finishingRef.current) return;

    setFinishing(true);
    finishingRef.current = true;

    try {
      const finished = finishLocalSession(currentSession.id);
      setSession(finished);

      if (!currentSession.id.startsWith("local-")) {
        const remote = await sessionAPI.terminer(currentSession.id, { session: finished });
        if (remote.success && remote.session) {
          upsertLocalSession(remote.session);
          setSession(remote.session);
        }
      }
    } finally {
      setFinishing(false);
      finishingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!session || session.status === "terminee") return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          void completeSession();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, completeSession]);

  const saveCurrentAnswer = async () => {
    if (!currentQuestion) return;
    await persistAnswer(currentQuestion.answer);
  };

  const goToQuestion = async (nextIndex) => {
    if (!currentQuestion) return;
    stopVoice();
    await saveCurrentAnswer();
    setCurrent(nextIndex);
  };

  const handleAnalyzeCurrent = async () => {
    if (!currentQuestion) return;
    stopVoice();
    await saveCurrentAnswer();
  };

  const handleFinish = async () => {
    stopVoice();
    await saveCurrentAnswer();
    await completeSession();
  };

  const toggleListening = () => {
    const Recognition = typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!Recognition || !recognitionRef.current) {
      setVoiceStatus(copy.voiceUnavailable);
      return;
    }

    if (listening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setListening(false);
      setVoiceStatus(copy.voiceReady);
      return;
    }

    stopVoice();
    setVoiceStatus(copy.listening);

    try {
      recognitionRef.current.start();
    } catch {
      setVoiceStatus(copy.voiceUnavailable);
    }
  };

  const replayQuestion = () => {
    if (!currentQuestion?.text) return;
    speakQuestion(currentQuestion.text);
  };

  if (loadingSession) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <section className={styles.panel}>
            <div className={styles.icon}>{ICONS.mic}</div>
            <h1>{copy.loadingTitle}</h1>
            <p>{copy.loadingSubtitle}</p>
          </section>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <section className={styles.panel}>
            <div className={styles.icon}>{ICONS.mic}</div>
            <h1>{copy.emptyTitle}</h1>
            <p>{copy.emptySubtitle}</p>
            <Link to="/simulation" className={styles.backLink}>
              {ICONS.arrowLeft} {copy.emptyBack}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (session.status === "terminee") {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <section className={styles.resultPanel}>
            <div className={styles.resultScore}>{session.score}%</div>
            <h1>{copy.finishedTitle}</h1>
            <p>{session.feedback?.summary}</p>
            <div className={styles.resultGrid}>
              <div>
                <span>{copy.resultAnswered}</span>
                <strong>{session.feedback?.answered}/{session.feedback?.total}</strong>
              </div>
              <div>
                <span>{copy.resultPoste}</span>
                <strong>{session.poste}</strong>
              </div>
              <div>
                <span>{copy.resultDuration}</span>
                <strong>{session.duree} min</strong>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={() => navigate("/historique")}>{copy.history}</button>
              <button className={styles.primaryBtn} onClick={() => navigate("/simulation")}>{copy.newInterview}</button>
            </div>

            <div className={styles.reportQuestions}>
              <h2>{language === "en" ? "Detailed Session Report" : "Rapport détaillé par question"}</h2>
              {Array.isArray(session.questions) && session.questions.map((q, index) => {
                const analysis = q.analysis;
                const isAnswered = String(q.answer || "").trim().length > 0;
                
                return (
                  <div key={q.id || index} className={styles.reportQuestionCard}>
                    <div className={styles.reportQuestionHead}>
                      <span className={styles.reportQuestionNumber}>Question {index + 1}</span>
                      <strong className={styles.reportQuestionText}>{q.text}</strong>
                    </div>
                    
                    <div className={styles.reportAnswerBox}>
                      <div className={styles.reportAnswerLabel}>{language === "en" ? "Your answer:" : "Votre réponse :"}</div>
                      <p className={styles.reportAnswerText}>
                        {isAnswered ? q.answer : <em className={styles.noAnswer}>{language === "en" ? "No answer provided" : "Pas de réponse fournie"}</em>}
                      </p>
                    </div>

                    {analysis ? (
                      <div className={styles.reportAnalysisBox}>
                        <div className={styles.reportAnalysisHeader}>
                          <div className={styles.reportAnalysisSummary}>
                            <strong>{language === "en" ? "AI Feedback Summary:" : "Analyse de la réponse :"}</strong>
                            <p>{analysis.summary}</p>
                          </div>
                          <div className={styles.reportQuestionScore}>
                            <span>Score</span>
                            <strong>{analysis.score}%</strong>
                          </div>
                        </div>

                        <div className={styles.reportMetricsGrid}>
                          <div className={styles.reportMetric}>
                            <span>{copy.clarity}</span>
                            <div className={styles.progressBarMini}>
                              <div className={styles.progressFillMini} style={{ width: `${analysis.clarity || 0}%` }} />
                            </div>
                            <small>{analysis.clarity || 0}%</small>
                          </div>
                          <div className={styles.reportMetric}>
                            <span>{copy.relevance}</span>
                            <div className={styles.progressBarMini}>
                              <div className={styles.progressFillMini} style={{ width: `${analysis.relevance || 0}%` }} />
                            </div>
                            <small>{analysis.relevance || 0}%</small>
                          </div>
                          <div className={styles.reportMetric}>
                            <span>{copy.structure}</span>
                            <div className={styles.progressBarMini}>
                              <div className={styles.progressFillMini} style={{ width: `${analysis.structure || 0}%` }} />
                            </div>
                            <small>{analysis.structure || 0}%</small>
                          </div>
                          <div className={styles.reportMetric}>
                            <span>{copy.confidence}</span>
                            <div className={styles.progressBarMini}>
                              <div className={styles.progressFillMini} style={{ width: `${analysis.confidence || 0}%` }} />
                            </div>
                            <small>{analysis.confidence || 0}%</small>
                          </div>
                        </div>

                        <div className={styles.reportListsGrid}>
                          <div className={styles.reportListBlock}>
                            <h5>{copy.strengths}</h5>
                            <ul>
                              {Array.isArray(analysis.strengths) && analysis.strengths.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className={styles.reportListBlock}>
                            <h5>{copy.improvements}</h5>
                            <ul>
                              {Array.isArray(analysis.improvements) && analysis.improvements.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {analysis.followUpQuestion && (
                          <div className={styles.reportFooterBlock}>
                            <h5>{copy.followUp}</h5>
                            <p>{analysis.followUpQuestion}</p>
                          </div>
                        )}

                        {analysis.rewrittenAnswer && (
                          <div className={styles.reportFooterBlock}>
                            <h5>{copy.rewritten}</h5>
                            <p className={styles.rewrittenText}>{analysis.rewrittenAnswer}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      isAnswered && (
                        <div className={styles.reportNoAnalysis}>
                          <p>
                            {language === "en" 
                              ? "⚠️ No detailed analysis available for this question." 
                              : "⚠️ Aucune analyse détaillée disponible pour cette question."}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const analysis = currentQuestion?.analysis;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <section className={styles.interviewShell}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h1>{session.poste}</h1>
              <span>
                {session.entreprise || "Entreprise non renseignée"} - {session.difficulte}
              </span>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.recruteurBadge}>
                <span>
                  {session.recruteur === "guillaume" ? "⚡" : session.recruteur === "sophie" ? "🔍" : session.recruteur === "thomas" ? "😊" : "✨"}
                </span>
                <span>
                  {session.recruteur ? session.recruteur.charAt(0).toUpperCase() + session.recruteur.slice(1) : "Aria"}
                </span>
              </div>
              <div className={styles.timer}>{formatTimer(secondsLeft)}</div>
            </div>
          </header>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.questionMeta}>
            <span>{copy.question} {current + 1}/{session.questions.length}</span>
            <span>{answeredCount} {copy.answered}</span>
          </div>

          <article className={styles.questionCard}>
            <div className={styles.questionIcon}>{ICONS.mic}</div>
            <p>{currentQuestion?.text}</p>
          </article>

          <div className={styles.voiceBar}>
            <button
              type="button"
              className={`${styles.secondaryBtn} ${listening ? styles.voiceBtnActive : ""}`}
              onClick={toggleListening}
              disabled={!speechSupported && !listening}
            >
              {listening ? ICONS.soundOff : ICONS.sound}
              {listening ? copy.listenStop : copy.listenStart}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={replayQuestion} disabled={speaking}>
              {ICONS.replay} {copy.replay}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={handleAnalyzeCurrent} disabled={analyzing}>
              {analyzing ? <span className={styles.inlineSpinner} /> : ICONS.spark}
              {analyzing ? copy.analyzing : copy.analyze}
            </button>
          </div>



          {displayedVoiceStatus && <p className={styles.voiceStatus}>{displayedVoiceStatus}</p>}

          <textarea
            className={styles.answer}
            value={currentQuestion?.answer || ""}
            onChange={(event) => updateAnswer(event.target.value)}
            placeholder={copy.answerPlaceholder}
          />

          {analysis && (
            <section className={styles.analysisCard}>
              <div className={styles.analysisHeader}>
                <div>
                  <p className={styles.analysisEyebrow}>{copy.analysisTitle}</p>
                  <h2>{analysis.summary}</h2>
                </div>
                <div className={styles.analysisScore}>{analysis.score}%</div>
              </div>

              <div className={styles.analysisMetrics}>
                <div className={styles.analysisMetric}>
                  <span>{copy.clarity}</span>
                  <strong>{analysis.clarity}%</strong>
                </div>
                <div className={styles.analysisMetric}>
                  <span>{copy.relevance}</span>
                  <strong>{analysis.relevance}%</strong>
                </div>
                <div className={styles.analysisMetric}>
                  <span>{copy.structure}</span>
                  <strong>{analysis.structure}%</strong>
                </div>
                <div className={styles.analysisMetric}>
                  <span>{copy.confidence}</span>
                  <strong>{analysis.confidence}%</strong>
                </div>
              </div>

              <div className={styles.analysisGrid}>
                <div className={styles.analysisBlock}>
                  <h4>{copy.strengths}</h4>
                  <ul>
                    {(analysis.strengths || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.analysisBlock}>
                  <h4>{copy.improvements}</h4>
                  <ul>
                    {(analysis.improvements || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.analysisFooter}>
                <div className={styles.analysisBlock}>
                  <h4>{copy.followUp}</h4>
                  <p>{analysis.followUpQuestion}</p>
                </div>
                <div className={styles.analysisBlock}>
                  <h4>{copy.rewritten}</h4>
                  <p>{analysis.rewrittenAnswer}</p>
                </div>
              </div>
            </section>
          )}

          <footer className={styles.footer}>
            <button
              className={styles.secondaryBtn}
              disabled={current === 0}
              onClick={() => void goToQuestion(Math.max(0, current - 1))}
            >
              {ICONS.arrowLeft} {copy.previous}
            </button>
            {current < session.questions.length - 1 ? (
              <button className={styles.primaryBtn} onClick={() => void goToQuestion(current + 1)}>
                {copy.next} {ICONS.arrowRight}
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={() => void handleFinish()} disabled={finishing}>
                {ICONS.check} {finishing ? copy.finishing : copy.finish}
              </button>
            )}
          </footer>
        </section>
      </main>

    </div>
  );
}
