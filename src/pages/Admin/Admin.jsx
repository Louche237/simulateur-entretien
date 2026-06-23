import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import { adminAPI } from "../../utils/api.js";
import styles from "./Admin.module.css";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers(),
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (usersRes.success) setUsers(usersRes.users);
      } catch (err) {
        setError("Impossible de charger les données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Tableau de bord Administrateur</h1>
          </div>

          {loading && (
            <div className={styles.loading}>Chargement...</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>{stats.totalUsers}</div>
                    <div className={styles.statLabel}>Utilisateurs</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📊</div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>{stats.totalSessions}</div>
                    <div className={styles.statLabel}>Sessions totales</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>✅</div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>{stats.finishedSessions}</div>
                    <div className={styles.statLabel}>Sessions terminées</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⭐</div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>{stats.averageScore}%</div>
                    <div className={styles.statLabel}>Score moyen</div>
                  </div>
                </div>
              </div>

              {/* Top Users */}
              <div className={styles.section}>
                <h2>Top Utilisateurs</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Rang</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Sessions</th>
                        <th>Score Moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topUsers.map((user, index) => (
                        <tr key={user.id}>
                          <td>#{index + 1}</td>
                          <td>
                            {user.prenom} {user.nom}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.sessionsCount}</td>
                          <td>{user.averageScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tous les utilisateurs */}
              <div className={styles.section}>
                <h2>Tous les utilisateurs ({users.length})</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            {user.prenom} {user.nom}
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={user.role === "admin" ? styles.roleAdmin : styles.roleUser}>
                              {user.role === "admin" ? "Admin" : "Utilisateur"}
                            </span>
                          </td>
                          <td>
                            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
