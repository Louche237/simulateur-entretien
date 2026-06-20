import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
