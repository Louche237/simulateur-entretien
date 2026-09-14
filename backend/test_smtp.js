import { sendConfirmationEmail, verifyEmailTransporter } from "./src/lib/email.js";

const to = process.argv[2] || "matenglopez@gmail.com";

console.log(`\n🔍 Test de configuration SMTP & envoi réel vers : ${to}\n`);

const status = await verifyEmailTransporter();
console.log("Statut transporteur :", status);

if (status.simulated) {
  console.log("\n⚠️  Le SMTP n'est pas encore configuré dans backend/.env.local (SMTP_USER ou SMTP_PASS est vide).");
  console.log("Remplissez SMTP_USER et SMTP_PASS dans backend/.env.local pour activer l'envoi réel.\n");
  process.exit(0);
}

if (!status.ok) {
  console.error("\n❌ Impossible de se connecter au serveur SMTP :", status.error);
  process.exit(1);
}

console.log("\n✉️  Envoi d'un e-mail de confirmation de test...");
const result = await sendConfirmationEmail({
  prenom: "Test",
  nom: "Utilisateur",
  email: to,
  confirmationToken: "test-token-" + Date.now(),
  clientOrigin: "http://localhost:5173",
});

console.log("\nRésultat de l'envoi :", result);
if (result.success) {
  console.log(`\n✅ Félicitations ! L'e-mail a été expédié avec succès. Vérifiez la boîte de réception de ${to} (y compris le dossier Spams).\n`);
} else {
  console.log(`\n❌ Échec de l'envoi : ${result.error}\n`);
}

process.exit(0);
