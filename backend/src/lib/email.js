import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.email.user || !config.email.pass) {
    console.warn("[EMAIL] SMTP non configuré - mode simulation activé");
    transporter = {
      sendMail: async (options) => {
        console.log("[EMAIL] Simulation d'envoi:", {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100),
        });
        return { messageId: "simulated-" + Date.now(), simulated: true };
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
  });

  return transporter;
};

export const sendWelcomeEmail = async ({ prenom, nom, email }) => {
  const nomComplet = `${prenom} ${nom}`.trim();
  const mail = getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #0f1f3d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue sur JobMentor 🎉</h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px;">Bonjour ${prenom || nomComplet},</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Merci de vous être inscrit sur <strong>JobMentor</strong> ! Votre compte a bien été créé.
        </p>
        <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #0f1f3d; margin: 0 0 12px; font-size: 16px;">🚀 Pour commencer :</h3>
          <ol style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Connectez-vous à votre espace</li>
            <li>Complétez votre profil dans la section Paramètres</li>
            <li>Lancez votre première simulation d'entretien</li>
            <li>Analysez vos performances et progressez !</li>
          </ol>
        </div>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          À bientôt sur JobMentor,<br />
          L'équipe JobMentor
        </p>
      </div>
      <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} JobMentor. Tous droits réservés.
      </div>
    </div>
  `;

  const text = `
Bienvenue sur JobMentor !

Bonjour ${prenom || nomComplet},

Merci de vous être inscrit sur JobMentor ! Votre compte a bien été créé.

Pour commencer :
1. Connectez-vous à votre espace
2. Complétez votre profil dans la section Paramètres
3. Lancez votre première simulation d'entretien
4. Analysez vos performances et progressez !

Si vous avez des questions, n'hésitez pas à nous contacter.

À bientôt sur JobMentor,
L'équipe JobMentor

© ${new Date().getFullYear()} JobMentor. Tous droits réservés.
  `.trim();

  try {
    const result = await mail.sendMail({
      from: config.email.from,
      to: email,
      subject: "Bienvenue sur JobMentor ! 🎉",
      html,
      text,
    });
    return { success: true, ...result };
  } catch (err) {
    console.error("[EMAIL] Erreur d'envoi:", err.message);
    return { success: false, error: err.message };
  }
};

export const sendConfirmationEmail = async ({ prenom, nom, email, confirmationToken, clientOrigin }) => {
  const nomComplet = `${prenom} ${nom}`.trim();
  const confirmUrl = `${clientOrigin}/confirm-email?token=${confirmationToken}`;
  const mail = getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #0f1f3d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Confirmez votre email 📧</h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px;">Bonjour ${prenom || nomComplet},</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Merci de vous être inscrit sur <strong>JobMentor</strong> ! Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirmer mon email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br />
          <a href="${confirmUrl}" style="color: #2563eb; word-break: break-all;">${confirmUrl}</a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Ce lien est valable 24 heures. Si vous n'avez pas demandé cette inscription, ignorez cet email.
        </p>
      </div>
      <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} JobMentor. Tous droits réservés.
      </div>
    </div>
  `;

  const text = `
Confirmez votre email - JobMentor

Bonjour ${prenom || nomComplet},

Merci de vous être inscrit sur JobMentor ! Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :

${confirmUrl}

Ce lien est valable 24 heures. Si vous n'avez pas demandé cette inscription, ignorez cet email.

© ${new Date().getFullYear()} JobMentor. Tous droits réservés.
  `.trim();

  try {
    const result = await mail.sendMail({
      from: config.email.from,
      to: email,
      subject: "Confirmez votre email - JobMentor",
      html,
      text,
    });
    return { success: true, ...result };
  } catch (err) {
    console.error("[EMAIL] Erreur d'envoi:", err.message);
    return { success: false, error: err.message };
  }
};
