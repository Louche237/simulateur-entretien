import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { computeGlobalStats } from "../services/globalStats.js";
import { readDb } from "../store.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/stats", (req, res) => {
  return res.json({
    success: true,
    stats: computeGlobalStats(),
  });
});

router.get("/users", (req, res) => {
  const db = readDb();
  return res.json({
    success: true,
    users: db.users.map(user => {
      const { passwordHash, ...publicUser } = user;
      return publicUser;
    }),
  });
});

export default router;
