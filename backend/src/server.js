import app from "./app.js";
import { config } from "./config.js";
import { ensureDb } from "./store.js";

ensureDb();

app.listen(config.port, () => {
  console.log(`Backend JobMentor prêt sur http://localhost:${config.port}`);
});
