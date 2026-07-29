import { Router } from "express";
import { upload } from "../middleware/upload.js";
import {
  getFrames,
  createFrame,
  deleteFrame
} from "../controllers/frame.controller.js";

const router = Router();

router.get("/frames", getFrames);
router.post("/frames", upload.single("image"), createFrame);
router.delete("/frames/:id", deleteFrame);

export default router;
