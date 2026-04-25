import { Router } from "express";
import orgRoutes from "./org.routes";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import ssoAdminRoutes from "./sso-admin.routes";

const router = Router();

router.use("/organizations", orgRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/admin/sso", ssoAdminRoutes);

export default router;
