import { Router } from "express";
import packageRoutes from "./package.routes.js";
import frameRoutes from "./frame.routes.js";
import stickerRoutes from "./sticker.routes.js";
import sessionRoutes from "./session.routes.js";

const router = Router();

router.use("/api", packageRoutes);
router.use("/api", frameRoutes);
router.use("/api", stickerRoutes);
router.use("/api", sessionRoutes);

export default router;
