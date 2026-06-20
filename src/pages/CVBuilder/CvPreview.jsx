import styles from "./CVBuilder.module.css";

/**
 * CvPreview
 * Rendu du CV en temps réel. Reçoit toutes les données du formulaire
 * et bascule la disposition selon le template choisi (Classique / Minimal / Moderne).
 *
 * Toutes les sections sont optionnelles à l'affichage : une section vide
 * (tableau vide ou champ non rempli) ne s'affiche pas dans l'aperçu.
 */
export default function CvPreview({
  template = "Moderne",
  color = "#7c3aed",
  fontSize = "normal",
  form,
  adaptation,
  photoUrl,
  experiences = [],
  education = [],
  skills = [],
  languages = [],
  certifications = [],
  projects = [],
  interests = [],
}) {
  const nom = form.nom || "Votre nom";
  const titre = adaptation?.suggestedTitle || form.titre || "";
  const resume = adaptation?.adaptedSummary || form.resume || "";
  const highlighted = adaptation?.highlightedSkills || [];

  const fontScale = { small: 0.9, normal: 1, large: 1.12 }[fontSize] || 1;

  const hasExperiences = experiences.some((e) => e.poste || e.entreprise || e.description);
  const hasEducation = education.some((e) => e.diplome || e.etablissement);
  const hasSkills = skills.some((s) => s.skill) || highlighted.length > 0;
  const hasLanguages = languages.some((l) => l.langue);
  const hasCertifications = certifications.some((c) => c.titre);
  const hasProjects = projects.some((p) => p.nom);
  const hasInterests = interests.some((i) => i.interest);

  if (template === "Classique") {
    return (
      <div
        className={styles.previewDoc}
        style={{ borderTopColor: color, fontSize: `${13 * fontScale}px` }}
      >
        <div style={{ padding: "28px 24px", textAlign: "center", borderBottom: `2px solid ${color}` }}>
          {photoUrl && (
            <img
              src={photoUrl}
              alt={nom}
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }}
            />
          )}
          <h2 style={{ fontSize: `${22 * fontScale}px`, fontWeight: 700, color: "#111827" }}>{nom}</h2>
          {titre && <p style={{ fontSize: `${13 * fontScale}px`, color, fontStyle: "italic", marginTop: 2 }}>{titre}</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", fontSize: `${11 * fontScale}px`, color: "#6b7280", marginTop: 8 }}>
            {form.email && <span>{form.email}</span>}
            {form.localisation && <span>Adresse : {form.localisation}</span>}
            {form.tel && <span>{form.tel}</span>}
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {resume && (
            <ClassiqueSection title="PROFIL" color={color}>
              <p>{resume}</p>
            </ClassiqueSection>
          )}

          {hasExperiences && (
            <ClassiqueSection title="EXPÉRIENCES PROFESSIONNELLES" color={color}>
              {experiences.filter((e) => e.poste || e.entreprise).map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <strong>{e.poste}</strong> {e.entreprise && `— ${e.entreprise}`} {e.dates && <span style={{ color: "#6b7280" }}>({e.dates})</span>}
                  {e.description && <p style={{ marginTop: 2 }}>{e.description}</p>}
                </div>
              ))}
            </ClassiqueSection>
          )}

          {hasEducation && (
            <ClassiqueSection title="FORMATION" color={color}>
              {education.filter((e) => e.diplome || e.etablissement).map((e, i) => (
                <p key={i}>
                  <strong>{e.diplome}</strong> {e.etablissement && `| ${e.etablissement}`} {e.dates && `(${e.dates})`}
                </p>
              ))}
            </ClassiqueSection>
          )}

          {hasSkills && (
            <ClassiqueSection title="COMPÉTENCES" color={color}>
              <TagRow items={highlighted.length > 0 ? highlighted : skills.map((s) => s.skill).filter(Boolean)} color={color} />
            </ClassiqueSection>
          )}

          {hasLanguages && (
            <ClassiqueSection title="LANGUES" color={color}>
              {languages.filter((l) => l.langue).map((l, i) => (
                <p key={i}>{l.langue} {l.niveau && `— ${l.niveau}`}</p>
              ))}
            </ClassiqueSection>
          )}

          {hasCertifications && (
            <ClassiqueSection title="CERTIFICATIONS" color={color}>
              {certifications.filter((c) => c.titre).map((c, i) => (
                <p key={i}><strong>{c.titre}</strong> {c.organisme && `— ${c.organisme}`} {c.date && `(${c.date})`}</p>
              ))}
            </ClassiqueSection>
          )}

          {hasProjects && (
            <ClassiqueSection title="PROJETS" color={color}>
              {projects.filter((p) => p.nom).map((p, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <strong>{p.nom}</strong>
                  {p.description && <p>{p.description}</p>}
                </div>
              ))}
            </ClassiqueSection>
          )}

          {hasInterests && (
            <ClassiqueSection title="CENTRES D'INTÉRÊT" color={color}>
              <TagRow items={interests.map((i) => i.interest).filter(Boolean)} color={color} />
            </ClassiqueSection>
          )}
        </div>
      </div>
    );
  }

  if (template === "Minimal") {
    return (
      <div
        className={styles.previewDoc}
        style={{ borderTopColor: "transparent", background: "#fafafa", fontSize: `${13 * fontScale}px` }}
      >
        <div style={{ padding: "28px 24px 18px", display: "flex", gap: 16, alignItems: "center" }}>
          {photoUrl && (
            <img src={photoUrl} alt={nom} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          )}
          <div>
            <h2 style={{ fontSize: `${20 * fontScale}px`, fontWeight: 600, color: "#111827" }}>{nom}</h2>
            {titre && <p style={{ fontSize: `${13 * fontScale}px`, color: "#6b7280" }}>{titre}</p>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: `${11 * fontScale}px`, color: "#9ca3af", marginTop: 4 }}>
              {form.email && <span>Email : {form.email}</span>}
              {form.localisation && <span>Adresse : {form.localisation}</span>}
            </div>
          </div>
        </div>

        {resume && (
          <p style={{ padding: "0 24px 16px", fontSize: `${12.5 * fontScale}px`, color: "#4b5563", lineHeight: 1.6 }}>
            {resume}
          </p>
        )}

        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {hasExperiences && (
            <MinimalSection title="Expérience" color={color}>
              {experiences.filter((e) => e.poste || e.entreprise).map((e, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <strong>{e.poste}</strong> {e.entreprise && `· ${e.entreprise}`}
                </div>
              ))}
            </MinimalSection>
          )}
          {hasEducation && (
            <MinimalSection title="Formation" color={color}>
              {education.filter((e) => e.diplome).map((e, i) => (
                <p key={i}>{e.diplome} {e.etablissement && `| ${e.etablissement}`}</p>
              ))}
            </MinimalSection>
          )}
          {hasLanguages && (
            <MinimalSection title="Langues" color={color}>
              {languages.filter((l) => l.langue).map((l, i) => (
                <span key={i} style={{ display: "block" }}>{l.langue} {l.niveau && `— ${l.niveau}`}</span>
              ))}
            </MinimalSection>
          )}
          {hasCertifications && (
            <MinimalSection title="Certifications" color={color}>
              {certifications.filter((c) => c.titre).map((c, i) => <p key={i}>{c.titre}</p>)}
            </MinimalSection>
          )}
          {hasSkills && (
            <MinimalSection title="Compétences" color={color}>
              <TagRow items={highlighted.length > 0 ? highlighted : skills.map((s) => s.skill).filter(Boolean)} color={color} subtle />
            </MinimalSection>
          )}
          {hasProjects && (
            <MinimalSection title="Projets" color={color}>
              {projects.filter((p) => p.nom).map((p, i) => <p key={i}>{p.nom}</p>)}
            </MinimalSection>
          )}
        </div>
      </div>
    );
  }

  /* ─── Moderne (par défaut) : sidebar colorée + contenu ─── */
  return (
    <div
      className={styles.previewDoc}
      style={{ borderTopColor: "transparent", display: "flex", minHeight: 700, fontSize: `${13 * fontScale}px` }}
    >
      <div style={{ width: "34%", background: color, color: "#fff", padding: "24px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
        {photoUrl && (
          <img src={photoUrl} alt={nom} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.4)" }} />
        )}
        <div>
          <h2 style={{ fontSize: `${17 * fontScale}px`, fontWeight: 700 }}>{nom}</h2>
          {titre && <p style={{ fontSize: `${12 * fontScale}px`, opacity: 0.85, marginTop: 2 }}>{titre}</p>}
        </div>

        {(form.email || form.tel || form.localisation) && (
          <ModerneSidebarSection title="Contact">
            {form.email && <p>Email: {form.email}</p>}
            {form.tel && <p>{form.tel}</p>}
            {form.localisation && <p>Adresse: {form.localisation}</p>}
          </ModerneSidebarSection>
        )}

        {hasLanguages && (
          <ModerneSidebarSection title="Langues">
            {languages.filter((l) => l.langue).map((l, i) => (
              <p key={i}>{l.langue} {l.niveau && `(${l.niveau})`}</p>
            ))}
          </ModerneSidebarSection>
        )}

        {hasSkills && (
          <ModerneSidebarSection title="Compétences">
            {(highlighted.length > 0 ? highlighted : skills.map((s) => s.skill).filter(Boolean)).map((s, i) => (
              <p key={i}>• {s}</p>
            ))}
          </ModerneSidebarSection>
        )}

        {hasInterests && (
          <ModerneSidebarSection title="Centres d'intérêt">
            {interests.filter((i) => i.interest).map((it, i) => <p key={i}>{it.interest}</p>)}
          </ModerneSidebarSection>
        )}
      </div>

      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {resume && (
          <ModerneMainSection title="PROFIL" color={color}>
            <p>{resume}</p>
          </ModerneMainSection>
        )}

        {hasExperiences && (
          <ModerneMainSection title="EXPÉRIENCES" color={color}>
            {experiences.filter((e) => e.poste || e.entreprise).map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{e.poste}</strong> {e.entreprise && `— ${e.entreprise}`} {e.dates && <span style={{ color: "#6b7280" }}>({e.dates})</span>}
                {e.description && <p style={{ marginTop: 2 }}>{e.description}</p>}
              </div>
            ))}
          </ModerneMainSection>
        )}

        {hasEducation && (
          <ModerneMainSection title="FORMATION" color={color}>
            {education.filter((e) => e.diplome).map((e, i) => (
              <p key={i}>
                <strong>{e.diplome}</strong> {e.etablissement && `| ${e.etablissement}`}
              </p>
            ))}
          </ModerneMainSection>
        )}

        {hasCertifications && (
          <ModerneMainSection title="CERTIFICATIONS" color={color}>
            {certifications.filter((c) => c.titre).map((c, i) => (
              <p key={i}>{c.titre} {c.organisme && `— ${c.organisme}`}</p>
            ))}
          </ModerneMainSection>
        )}

        {hasProjects && (
          <ModerneMainSection title="PROJETS" color={color}>
            {projects.filter((p) => p.nom).map((p, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <strong>{p.nom}</strong>
                {p.description && <p>{p.description}</p>}
              </div>
            ))}
          </ModerneMainSection>
        )}
      </div>
    </div>
  );
}

/* ─── Sous-composants de mise en page (locaux, non exportés) ─── */

function ClassiqueSection({ title, color, children }) {
  return (
    <div>
      <h4 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: `1px solid ${color}33`, paddingBottom: 4, marginBottom: 8 }}>
        {title}
      </h4>
      <div style={{ color: "#374151", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function MinimalSection({ title, color, children }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
        {title}
      </h4>
      <div style={{ color: "#374151", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function ModerneSidebarSection({ title, children }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", opacity: 0.85, marginBottom: 6 }}>
        {title}
      </h4>
      <div style={{ fontSize: 11.5, lineHeight: 1.7, opacity: 0.95 }}>{children}</div>
    </div>
  );
}

function ModerneMainSection({ title, color, children }) {
  return (
    <div>
      <h4 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
        {title}
      </h4>
      <div style={{ color: "#374151", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function TagRow({ items, color, subtle = false }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            background: subtle ? "#f3f4f6" : `${color}1A`,
            color: subtle ? "#4b5563" : color,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
