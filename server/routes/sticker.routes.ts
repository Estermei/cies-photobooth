import { Router } from "express";
import { upload } from "../middleware/upload.js";
import {
  getStickers,
  createSticker,
  deleteSticker
} from "../controllers/sticker.controller.js";

const router = Router();

router.get("/stickers", getStickers);
router.post("/stickers", upload.single("image"), createSticker);
router.delete("/stickers/:id", deleteSticker);

export default router;
