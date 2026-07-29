import { Router } from "express";
import { upload } from "../middleware/upload.js";
import {
  adminLogin,
  createSession,
  getSessionById,
  getAdminSessions,
  uploadPaymentProof,
  approveSession,
  deleteSession
} from "../controllers/session.controller.js";

const router = Router();

router.post("/admin/login", adminLogin);
router.post("/sessions", createSession);
router.get("/sessions/:id", getSessionById);
router.post("/sessions/:id/proof", upload.single("image"), uploadPaymentProof);

// Rute sesi khusus admin
router.get("/admin/sessions", getAdminSessions);
router.post("/admin/sessions/:id/approve", approveSession);
router.delete("/admin/sessions/:id", deleteSession);

export default router;
