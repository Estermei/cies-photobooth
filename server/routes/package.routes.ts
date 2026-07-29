import { Router } from "express";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage
} from "../controllers/package.controller.js";

const router = Router();

router.get("/packages", getPackages);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.delete("/packages/:id", deletePackage);

export default router;
