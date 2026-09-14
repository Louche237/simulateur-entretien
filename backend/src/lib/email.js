import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  const isConfigured = Boolean(config.email.user && config.email.pass);

  if (!isConfigured) {
    console.warn("\n⚠️  [EMAIL] SMTP non configuré dans .env.local — Mode simulation activé.");
    console.warn("ℹ️  Les liens de confirmation seront affichés directement dans ce terminal pour vos tests.\n");

    transporter = {
      sendMail: async (options) => {
        const linkMatch = options.text?.match(/https?:\/\/[^\s]+/i) || options.html?.match(/href="(https?:\/\/[^"]+)"/i);
        const link = linkMatch ? (linkMatch[1] || linkMatch[0]) : null;

        console.log("\n" + "═".repeat(70));
        console.log("📨  [EMAIL SIMULATION] Envoi simulé avec succès :");
        console.log(`   ➤ Destinataire : ${options.to}`);
        console.log(`   ➤ Sujet        : ${options.subject}`);
        if (link) {
          console.log(`   ➤ Lien d'action: \x1b[36m${link}\x1b[0m`);
        }
        console.log("═".repeat(70) + "\n");

        return { messageId: "simulated-" + Date.now(), simulated: true, link };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
};

export const verifyEmailTransporter = async () => {
  const isConfigured = Boolean(config.email.user && config.email.pass);
  if (!isConfigured) {
    return { ok: false, simulated: true, message: "Mode simulation actif (identifiants SMTP absents)" };
  }

  try {
    const mail = getTransporter();
    if (typeof mail.verify === "function") {
      await mail.verify();
      console.log(`✅ [EMAIL] Connexion SMTP établie avec succès (${config.email.host}:${config.email.port})`);
      return { ok: true, simulated: false };
    }
    return { ok: true, simulated: false };
  } catch (err) {
    console.error(`❌ [EMAIL] Échec de connexion SMTP (${config.email.host}) :`, err.message);
    return { ok: false, simulated: false, error: err.message };
  }
};

export const sendConfirmationEmail = async ({ prenom, nom, email, confirmationToken, clientOrigin }) => {
  const nomComplet = `${prenom || ""} ${nom || ""}`.trim() || "Candidat";
  const salutation = prenom?.trim() || nomComplet;
  const baseUrl = (clientOrigin || "http://localhost:5173").replace(/\/$/, "");
  const confirmUrl = `${baseUrl}/confirm-email?token=${confirmationToken}`;
  const mail = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmez votre adresse e-mail — JobMentor</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #0f1f3d 0%, #1e3a8a 100%); padding: 36px 24px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.12); padding: 10px 20px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
                    <span style="color: #60a5fa; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">JobMentor</span>
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Confirmez votre inscription</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 36px 32px 28px 32px;">
                  <p style="font-size: 17px; line-height: 1.6; margin: 0 0 16px 0; color: #0f172a;">
                    Bonjour <strong>${salutation}</strong>,
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">
                    Merci d'avoir rejoint <strong>JobMentor</strong>, la plateforme d'entraînement aux entretiens d'embauche par intelligence artificielle.
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 32px 0; color: #475569;">
                    Pour valider votre compte et commencer vos simulations vocales et techniques en toute sécurité, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :
                  </p>
                  
                  <!-- Button CTA -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <a href="${confirmUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-align: center;">
                          Confirmer mon adresse e-mail →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Information Box -->
                  <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 18px; margin-bottom: 28px;">
                    <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                      ⏰ <strong>Validité :</strong> Ce lien est actif pendant <strong>24 heures</strong>. Passé ce délai, vous pourrez demander un nouveau lien directement depuis l'application.
                    </p>
                  </div>

                  <!-- Fallback Link -->
                  <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 8px 0;">
                    Si le bouton ci-dessus ne fonctionne pas, copiez et collez l'URL suivante dans votre navigateur :
                  </p>
                  <p style="font-size: 12px; line-height: 1.5; color: #2563eb; word-break: break-all; margin: 0 0 28px 0; background-color: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: monospace;">
                    <a href="${confirmUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${confirmUrl}</a>
                  </p>

                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />

                  <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    Si vous n'êtes pas à l'origine de cette inscription sur JobMentor, vous pouvez ignorer cet e-mail en toute sécurité. Aucun compte actif ne sera créé sans validation.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;">
                    © ${new Date().getFullYear()} JobMentor. Tous droits réservés.
                  </p>
                  <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                    Ce message automatique a été envoyé à ${email}.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Bonjour ${salutation},

Merci d'avoir rejoint JobMentor !

Pour confirmer votre adresse e-mail et activer pleinement votre compte candidat, veuillez cliquer sur le lien suivant (ou le copier dans votre navigateur) :

${confirmUrl}

⏰ Ce lien de confirmation est valable pendant 24 heures.

Si vous n'avez pas demandé à créer de compte sur JobMentor, ignorez simplement cet e-mail.

À bientôt sur JobMentor,
L'équipe JobMentor
© ${new Date().getFullYear()} JobMentor
  `.trim();

  try {
    const result = await mail.sendMail({
      from: config.email.from,
      to: email,
      subject: "Confirmez votre adresse e-mail — JobMentor",
      html,
      text,
    });
    return { success: true, ...result };
  } catch (err) {
    console.error("[EMAIL] Erreur lors de l'envoi de l'e-mail de confirmation :", err.message);
    return { success: false, error: err.message };
  }
};

export const sendWelcomeEmail = async ({ prenom, nom, email }) => {
  const nomComplet = `${prenom || ""} ${nom || ""}`.trim() || "Candidat";
  const salutation = prenom?.trim() || nomComplet;
  const mail = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Bienvenue sur JobMentor 🎉</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #0f1f3d 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Votre compte est vérifié ! 🎉</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 16px;">Félicitations ${salutation},</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    Votre adresse e-mail a bien été confirmée. Vous pouvez désormais exploiter toute la puissance de <strong>JobMentor</strong>.
                  </p>
                  <div style="background-color: #eff6ff; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #dbeafe;">
                    <h3 style="color: #1e40af; margin: 0 0 12px; font-size: 15px;">🚀 Vos prochaines étapes recommandées :</h3>
                    <ol style="color: #1e3a8a; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                      <li>Téléversez ou créez votre CV dans la section <strong>Analyse CV</strong></li>
                      <li>Configurez votre première simulation d'entretien vocal personnalisé</li>
                      <li>Consultez votre analyse IA pour corriger vos points faibles</li>
                    </ol>
                  </div>
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    À bientôt sur JobMentor,<br />
                    <strong>L'équipe JobMentor</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                    © ${new Date().getFullYear()} JobMentor. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Bienvenue sur JobMentor !

Bonjour ${salutation},

Votre adresse e-mail a été confirmée avec succès. Vous avez désormais accès à l'ensemble des fonctionnalités de JobMentor :
- Simulations d'entretiens vocaux avec feedback IA
- Analyse et scoring automatique de CV
- Suivi de votre progression et conseils sur-mesure

Connectez-vous dès maintenant pour démarrer votre entraînement !

L'équipe JobMentor
© ${new Date().getFullYear()} JobMentor
  `.trim();

  try {
    const result = await mail.sendMail({
      from: config.email.from,
      to: email,
      subject: "Bienvenue sur JobMentor ! Votre compte est activé 🎉",
      html,
      text,
    });
    return { success: true, ...result };
  } catch (err) {
    console.error("[EMAIL] Erreur d'envoi du message de bienvenue :", err.message);
    return { success: false, error: err.message };
  }
};
