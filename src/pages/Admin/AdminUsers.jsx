import { useState } from "react";
import {
  RefreshCw,
  UserPlus,
  Search,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import styles from "./Admin.module.css";
import { adminAPI } from "../../utils/api";
import UserModal from "./Modals/UserModal";

export default function AdminUsers({
  users: initialUsers,
  onUserUpdate,
  onUserDelete,
  onUserCreate,
  onRefresh,
}) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmedFilter, setConfirmedFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync with prop updates
  if (initialUsers !== users && initialUsers.length !== users.length) {
    setUsers(initialUsers);
  }

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.prenom} ${user.nom} ${user.email} ${user.id}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
    const matchesConfirmed =
      confirmedFilter === "all"
        ? true
        : confirmedFilter === "confirmed"
          ? Boolean(user.emailConfirmed)
          : !user.emailConfirmed;

    return matchesSearch && matchesRole && matchesConfirmed;
  });

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData, userId) => {
    if (userId) {
      const res = await adminAPI.updateUser(userId, formData);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? res.user : u))
        );
        onUserUpdate?.(res.user);
      } else {
        throw new Error(res.message || "Erreur lors de la mise à jour");
      }
    } else {
      const res = await adminAPI.createUser(formData);
      if (res.success) {
        setUsers((prev) => [res.user, ...prev]);
        onUserCreate?.(res.user);
      } else {
        throw new Error(res.message || "Erreur lors de la création");
      }
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    const res = await adminAPI.resetUserPassword(userId, newPassword);
    if (!res.success) {
      throw new Error(res.message || "Erreur lors du reset");
    }
    alert("Mot de passe mis à jour avec succès.");
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur et toutes ses sessions associées ?")) {
      try {
        const res = await adminAPI.deleteUser(userId);
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          onUserDelete?.(userId);
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Erreur lors de la suppression de l'utilisateur.");
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Gestion des Utilisateurs ({users.length})</h2>
          <p className={styles.sectionDesc}>
            Créez, modifiez, changez les rôles ou réinitialisez les mots de passe des candidats et administrateurs.
          </p>
        </div>
        <div className={styles.headerBtnGroup}>
          <button className={styles.refreshBtn} onClick={onRefresh}>
            <RefreshCw size={15} strokeWidth={2} />
            <span>Actualiser</span>
          </button>
          <button className={styles.primaryBtn} onClick={handleOpenCreate}>
            <UserPlus size={16} strokeWidth={2} />
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIconSvg} strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Rôle :</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les rôles</option>
            <option value="user">Candidats</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Email :</label>
          <select
            value={confirmedFilter}
            onChange={(e) => setConfirmedFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous</option>
            <option value="confirmed">Confirmé</option>
            <option value="unconfirmed">Non confirmé</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Email Confirmé</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyCell}>
                  Aucun utilisateur trouvé pour ces critères.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className={styles.monoId}>{user.id}</td>
                  <td>
                    <strong>{user.prenom} {user.nom}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={
                        user.role === "admin" ? styles.roleAdmin : styles.roleUser
                      }
                    >
                      {user.role === "admin" ? "Administrateur" : "Candidat"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.emailConfirmed
                          ? styles.statusBadgeSuccess
                          : styles.statusBadgeWarning
                      }
                    >
                      {user.emailConfirmed ? (
                        <>
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Confirmé</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} strokeWidth={2.5} />
                          <span>En attente</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td>
                    <div className={styles.actionBtnsRow}>
                      <button
                        className={styles.actionBtnEdit}
                        onClick={() => handleOpenEdit(user)}
                        title="Modifier ou réinitialiser le mot de passe"
                      >
                        <SlidersHorizontal size={13} strokeWidth={2} />
                        <span>Gérer</span>
                      </button>
                      <button
                        className={styles.actionBtnDelete}
                        onClick={() => handleDeleteUser(user.id)}
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        onResetPassword={handleResetPassword}
        user={selectedUser}
      />
    </div>
  );
}