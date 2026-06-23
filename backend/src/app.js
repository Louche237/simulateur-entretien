import cors from "cors";
import express from "express";
import { config } from "./config.js";
import authRouter from "./routes/auth.js";
import cvRouter from "./routes/cv.js";
import healthRouter from "./routes/health.js";
import sessionsRouter from "./routes/sessions.js";
import simulationRouter from "./routes/simulation.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: false,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/simulation", simulationRouter);
app.use("/api/cv", cvRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Fichier trop volumineux",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur",
  });
});

export default app;
