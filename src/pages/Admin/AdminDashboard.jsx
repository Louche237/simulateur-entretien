import {
  Users,
  MailCheck,
  Video,
  CheckCircle2,
  TrendingUp,
  Trophy,
  ArrowUpRight,
} from "lucide-react";
import styles from "./Admin.module.css";

/* ══════════════════════════════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════════════════════════════ */

function last30Days() {
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    days.push({ iso, label });
  }
  return days;
}

function buildDailySeries(byDate) {
  return last30Days().map(({ iso, label }) => ({
    label,
    value: byDate?.[iso] || 0,
  }));
}

/* ══════════════════════════════════════════════════════════════
   AREA CHART SVG (courbe lissée + remplissage en dégradé)
══════════════════════════════════════════════════════════════ */

function AreaChartSVG({ series1, series2, color1 = "#4f46e5", color2 = "#0d9488", label1 = "A", label2 = "B", height = 180 }) {
  const W = 100; // viewBox width en % (unités relatives)
  const H = height;
  const PAD = { top: 12, right: 4, bottom: 28, left: 28 };

  const all = [...(series1 || []).map((d) => d.value), ...(series2 || []).map((d) => d.value)];
  const maxVal = Math.max(...all, 1);

  const len = (series1 || []).length;
  if (!len) return null;

  const xs = series1.map((_, i) => PAD.left + (i / (len - 1)) * (W - PAD.left - PAD.right));
  const ys = (series) =>
    series.map((d) => PAD.top + (1 - d.value / maxVal) * (H - PAD.top - PAD.bottom));

  function smoothPath(xs, ys) {
    if (xs.length < 2) return "";
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    return d;
  }

  function areaPath(xs, ys) {
    const bottom = H - PAD.bottom;
    return smoothPath(xs, ys) + ` L ${xs[xs.length - 1]} ${bottom} L ${xs[0]} ${bottom} Z`;
  }

  const ys1 = ys(series1);
  const ys2 = series2 ? ys(series2) : null;

  // ticks Y
  const ticks = [0, Math.round(maxVal / 2), maxVal];
  const tickY = (v) => PAD.top + (1 - v / maxVal) * (H - PAD.top - PAD.bottom);

  // ticks X (every 5 days)
  const xLabels = series1.filter((_, i) => i % 6 === 0 || i === len - 1);
  const xLabelXs = xLabels.map((_, j) => {
    const origIdx = series1.indexOf(xLabels[j]);
    return origIdx === -1 ? 0 : PAD.left + (origIdx / (len - 1)) * (W - PAD.left - PAD.right);
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: H, display: "block" }}
    >
      <defs>
        <linearGradient id={`g1_${color1.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color1} stopOpacity="0" />
        </linearGradient>
        {ys2 && (
          <linearGradient id={`g2_${color2.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color2} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* grid lines */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={tickY(v)}
            x2={W - PAD.right} y2={tickY(v)}
            stroke="#f1f5f9" strokeWidth="0.4"
          />
          <text x={PAD.left - 2} y={tickY(v) + 1} textAnchor="end" fontSize="3" fill="#94a3b8">{v}</text>
        </g>
      ))}

      {/* x labels */}
      {xLabels.map((d, j) => (
        <text key={j} x={xLabelXs[j]} y={H - PAD.bottom + 7} textAnchor="middle" fontSize="2.8" fill="#94a3b8">
          {d.label}
        </text>
      ))}

      {/* Area 2 */}
      {ys2 && (
        <>
          <path d={areaPath(xs, ys2)} fill={`url(#g2_${color2.replace("#", "")})`} />
          <path d={smoothPath(xs, ys2)} fill="none" stroke={color2} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}

      {/* Area 1 */}
      <path d={areaPath(xs, ys1)} fill={`url(#g1_${color1.replace("#", "")})`} />
      <path d={smoothPath(xs, ys1)} fill="none" stroke={color1} strokeWidth="0.9" strokeLinecap="round" />

      {/* dots at data points (sampled) */}
      {series1
        .map((d, i) => ({ d, i }))
        .filter(({ i }) => i % 7 === 0 || i === len - 1)
        .map(({ d, i }) => (
          <circle key={i} cx={xs[i]} cy={ys1[i]} r="1.2" fill={color1} />
        ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   DONUT CHART SVG
══════════════════════════════════════════════════════════════ */

function DonutSVG({ segments, size = 120, thickness = 22 }) {
  const R = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;

  let angle = -Math.PI / 2;
  const arcs = segments.map((seg) => {
    const theta = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    angle += theta;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const large = theta > Math.PI ? 1 : 0;
    return { ...seg, x1, y1, x2, y2, large, theta };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) =>
        arc.theta > 0.01 ? (
          <path
            key={i}
            d={`M ${arc.x1} ${arc.y1} A ${R} ${R} 0 ${arc.large} 1 ${arc.x2} ${arc.y2}`}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
        ) : null
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   BAR CHART SVG (horizontal)
══════════════════════════════════════════════════════════════ */

function HBarChart({ bars, maxVal }) {
  const max = maxVal || Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bars.map((bar, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            <span>{bar.label}</span>
            <strong style={{ color: "#0f172a" }}>{bar.value}</strong>
          </div>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(bar.value / max) * 100}%`,
                background: bar.gradient || bar.color || "#4f46e5",
                borderRadius: 99,
                transition: "width 0.7s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════════ */

function KpiCard({ icon: Icon, color, value, label, sub }) {
  return (
    <div className={styles.kpiCard} style={{ "--kpi-color": color }}>
      <div className={styles.kpiIconWrap}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className={styles.kpiContent}>
        <div className={styles.kpiValue}>{value}</div>
        <div className={styles.kpiLabel}>{label}</div>
        {sub && <div className={styles.kpiSub}>{sub}</div>}
      </div>
      <ArrowUpRight size={14} className={styles.kpiArrow} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */

export default function AdminDashboard({ stats, onNavigateTab }) {
  if (!stats) return null;

  const userSeries = buildDailySeries(stats.usersByDate);
  const sessionSeries = buildDailySeries(stats.sessionsByDate);

  const confirmedPct = stats.totalUsers
    ? Math.round((stats.totalConfirmedUsers / stats.totalUsers) * 100)
    : 0;

  const finishedPct = stats.totalSessions
    ? Math.round((stats.finishedSessions / stats.totalSessions) * 100)
    : 0;

  return (
    <>
      {/* ── 1. KPI Row ─────────────────────────────────────── */}
      <div className={styles.kpiRow}>
        <KpiCard
          icon={Users}
          color="#4f46e5"
          value={stats.totalUsers}
          label="Utilisateurs inscrits"
          sub={`${stats.totalConfirmedUsers} confirmés`}
        />
        <KpiCard
          icon={Video}
          color="#2563eb"
          value={stats.totalSessions}
          label="Sessions totales"
          sub={`${stats.finishedSessions} terminées`}
        />
        <KpiCard
          icon={TrendingUp}
          color="#d97706"
          value={`${stats.averageScore}%`}
          label="Score moyen global"
        />
        <KpiCard
          icon={CheckCircle2}
          color="#0d9488"
          value={`${finishedPct}%`}
          label="Taux de complétion"
          sub={`${stats.finishedSessions} / ${stats.totalSessions} sessions`}
        />
      </div>

      {/* ── 2. Grille graphiques ───────────────────────────── */}
      <div className={styles.chartsGrid}>

        {/* GRAPHIQUE EN AIRES — Activité 30 jours */}
        <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3 className={styles.chartTitle}>Activité — 30 derniers jours</h3>
              <p className={styles.chartSub}>
                Nouvelles inscriptions &amp; sessions terminées par jour
              </p>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendDot} style={{ background: "#4f46e5" }} />
              <span>Inscriptions</span>
              <span className={styles.legendDot} style={{ background: "#0d9488", marginLeft: 10 }} />
              <span>Sessions</span>
            </div>
          </div>
          <div className={styles.chartBody}>
            <AreaChartSVG
              series1={userSeries}
              series2={sessionSeries}
              color1="#4f46e5"
              color2="#0d9488"
              label1="Inscriptions"
              label2="Sessions"
              height={200}
            />
          </div>
        </div>

        {/* DONUT — Emails confirmés */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3 className={styles.chartTitle}>Emails confirmés</h3>
              <p className={styles.chartSub}>Taux de validation des comptes</p>
            </div>
            <MailCheck size={16} className={styles.chartHeaderIcon} />
          </div>
          <div className={styles.chartBody} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <DonutSVG
                size={130}
                thickness={20}
                segments={[
                  { value: stats.totalConfirmedUsers, color: "#4f46e5" },
                  { value: stats.totalUsers - stats.totalConfirmedUsers, color: "#e2e8f0" },
                ]}
              />
              <div className={styles.donutCenter}>
                <span className={styles.donutPct}>{confirmedPct}%</span>
                <span className={styles.donutLbl}>confirmés</span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.donutLegendItem}>
                <span className={styles.donutLegendDot} style={{ background: "#4f46e5" }} />
                <span>Confirmés</span>
                <strong>{stats.totalConfirmedUsers}</strong>
              </div>
              <div className={styles.donutLegendItem}>
                <span className={styles.donutLegendDot} style={{ background: "#e2e8f0" }} />
                <span>Non confirmés</span>
                <strong>{stats.totalUsers - stats.totalConfirmedUsers}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* BARRES HORIZONTALES — Sessions & Score */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3 className={styles.chartTitle}>Performance</h3>
              <p className={styles.chartSub}>Répartition des sessions & score</p>
            </div>
            <Video size={16} className={styles.chartHeaderIcon} />
          </div>
          <div className={styles.chartBody}>
            <HBarChart
              bars={[
                {
                  label: "Sessions totales",
                  value: stats.totalSessions,
                  gradient: "linear-gradient(90deg,#818cf8,#4f46e5)",
                },
                {
                  label: "Sessions terminées",
                  value: stats.finishedSessions,
                  gradient: "linear-gradient(90deg,#2dd4bf,#0d9488)",
                },
                {
                  label: "En cours",
                  value: stats.totalSessions - stats.finishedSessions,
                  gradient: "linear-gradient(90deg,#fbbf24,#d97706)",
                },
              ]}
              maxVal={stats.totalSessions || 1}
            />

            {/* Score moyen */}
            <div className={styles.scoreMeterWrap}>
              <div className={styles.scoreMeterLabel}>
                <TrendingUp size={13} style={{ color: "#d97706" }} />
                <span>Score moyen global</span>
                <strong>{stats.averageScore}%</strong>
              </div>
              <div className={styles.scoreMeterTrack}>
                <div
                  className={styles.scoreMeterFill}
                  style={{
                    width: `${stats.averageScore}%`,
                    background:
                      stats.averageScore >= 70
                        ? "linear-gradient(90deg,#34d399,#059669)"
                        : stats.averageScore >= 40
                        ? "linear-gradient(90deg,#fbbf24,#d97706)"
                        : "linear-gradient(90deg,#f87171,#dc2626)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Top Candidats ──────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Top Candidats Actifs</h2>
            <p className={styles.sectionDesc}>
              Candidats ayant complété le plus d'entraînements sur JobMentor.
            </p>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Candidat</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Entretiens réalisés</th>
                <th>Score Moyen</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers && stats.topUsers.length > 0 ? (
                stats.topUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <span
                        className={`${styles.rankBadge} ${
                          index === 0
                            ? styles.rank1
                            : index === 1
                            ? styles.rank2
                            : index === 2
                            ? styles.rank3
                            : ""
                        }`}
                      >
                        {index === 0 && <Trophy size={11} strokeWidth={2.5} />}
                        #{index + 1}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {user.prenom} {user.nom}
                      </strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={
                          user.role === "admin" ? styles.roleAdmin : styles.roleUser
                        }
                      >
                        {user.role === "admin" ? "Admin" : "Candidat"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.sessionsBadge}>
                        {user.sessionsCount} session(s)
                      </span>
                    </td>
                    <td>
                      <strong
                        className={
                          user.averageScore >= 70
                            ? styles.scoreHigh
                            : styles.scoreMid
                        }
                      >
                        {user.averageScore}%
                      </strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.emptyCell}>
                    Aucune session d'entretien enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}