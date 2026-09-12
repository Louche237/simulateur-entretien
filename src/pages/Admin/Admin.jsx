import { useState, useEffect } from "react";
import AdminSidebar, { ADMIN_TABS } from "../../components/AdminSidebar/AdminSidebar.jsx";
import { adminAPI } from "../../utils/api.js";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminSessions from "./AdminSessions.jsx";
import AdminQuestions from "./AdminQuestions.jsx";
import AdminDatabase from "./AdminDatabase.jsx";
import AdminSettings from "./AdminSettings.jsx";
import styles from "./Admin.module.css";

export default function Admin() {
  const [activeTab, setActiveTab] = useState(ADMIN_TABS.OVERVIEW);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const refreshStats = () =>
    adminAPI.getStats().then((res) => res.success && setStats(res.stats));

  const refreshUsers = () =>
    adminAPI.getUsers().then((res) => res.success && setUsers(res.users));

  const refreshSessions = () =>
    adminAPI.getSessions().then((res) => res.success && setSessions(res.sessions));

  const refreshQuestions = () =>
    adminAPI.getQuestions().then((res) => res.success && setQuestions(res.questions));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, usersRes, sessionsRes, questionsRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers(),
          adminAPI.getSessions(),
          adminAPI.getQuestions(),
        ]);
        if (cancelled) return;
        if (statsRes.success) setStats(statsRes.stats);
        if (usersRes.success) setUsers(usersRes.users);
        if (sessionsRes.success) setSessions(sessionsRes.sessions);
        if (questionsRes.success) setQuestions(questionsRes.questions);
      } catch (err) {
        if (!cancelled) setError("Impossible de charger les données administrateur.");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // User Actions
  const handleUserCreate = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    Promise.all([refreshStats(), refreshUsers()]).catch(() => {});
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    Promise.all([refreshStats(), refreshUsers()]).catch(() => {});
  };

  const handleUserDelete = (deletedUserId) => {
    setUsers((prev) => prev.filter((u) => u.id !== deletedUserId));
    Promise.all([refreshStats(), refreshUsers(), refreshSessions()]).catch(() => {});
  };

  // Session Actions
  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette session d'entretien ?")) {
      try {
        const res = await adminAPI.deleteSession(sessionId);
        if (res.success) {
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          refreshStats().catch(() => {});
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Erreur lors de la suppression de la session.");
      }
    }
  };

  // Question Actions
  const handleCreateQuestion = async (formData) => {
    const res = await adminAPI.createQuestion(formData);
    if (res.success) {
      setQuestions((prev) => [...prev, res.question]);
    } else {
      throw new Error(res.message || "Erreur création question");
    }
  };

  const handleUpdateQuestion = async (id, formData) => {
    const res = await adminAPI.updateQuestion(id, formData);
    if (res.success) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? res.question : q))
      );
    } else {
      throw new Error(res.message || "Erreur mise à jour question");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      try {
        const res = await adminAPI.deleteQuestion(id);
        if (res.success) {
          setQuestions((prev) => prev.filter((q) => q.id !== id));
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Erreur suppression question");
      }
    }
  };

  const handleResetQuestions = async () => {
    if (window.confirm("Voulez-vous réinitialiser toutes les questions avec le pack standard par défaut ?")) {
      try {
        const res = await adminAPI.resetQuestions();
        if (res.success) {
          setQuestions(res.questions || []);
          alert("Banque de questions réinitialisée avec succès !");
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Erreur lors de la réinitialisation.");
      }
    }
  };

  const counts = {
    users: users.length,
    sessions: sessions.length,
    questions: questions.length,
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <h1 className={styles.pageTitle}>
                {activeTab === ADMIN_TABS.OVERVIEW && "Vue d'ensemble"}
                {activeTab === ADMIN_TABS.USERS && "Gestion des utilisateurs"}
                {activeTab === ADMIN_TABS.SESSIONS && "Sessions d'entretien"}
                {activeTab === ADMIN_TABS.QUESTIONS && "Banque de questions"}
                {activeTab === ADMIN_TABS.DATABASE && "Base de données MySQL"}
                {activeTab === ADMIN_TABS.SETTINGS && "Paramètres"}
              </h1>
              <span className={styles.adminTag}>
                Connecté : {currentUser.prenom} {currentUser.nom}
              </span>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Chargement des données administrateur...</span>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && (
            <>
              {activeTab === ADMIN_TABS.OVERVIEW && stats && (
                <AdminDashboard stats={stats} onNavigateTab={setActiveTab} />
              )}
              {activeTab === ADMIN_TABS.USERS && (
                <AdminUsers
                  users={users}
                  onUserCreate={handleUserCreate}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
                  onRefresh={refreshUsers}
                />
              )}
              {activeTab === ADMIN_TABS.SESSIONS && (
                <AdminSessions
                  sessions={sessions}
                  onDeleteSession={handleDeleteSession}
                  onRefresh={refreshSessions}
                />
              )}
              {activeTab === ADMIN_TABS.QUESTIONS && (
                <AdminQuestions
                  questions={questions}
                  onCreateQuestion={handleCreateQuestion}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onResetQuestions={handleResetQuestions}
                  onRefresh={refreshQuestions}
                />
              )}
              {activeTab === ADMIN_TABS.DATABASE && <AdminDatabase />}
              {activeTab === ADMIN_TABS.SETTINGS && <AdminSettings />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
