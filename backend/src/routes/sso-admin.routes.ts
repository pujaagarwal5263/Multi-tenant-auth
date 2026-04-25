import { Router } from "express";
import { SsoAdminController } from "../controllers/sso-admin.controller";
import { validateConfigureSso } from "../validators/sso.validator";

const router = Router();

router.post("/:orgId/config", validateConfigureSso, SsoAdminController.configureSso);
router.get("/:orgId/config", SsoAdminController.getSsoConfig);
router.delete("/:orgId/config", SsoAdminController.deleteSsoConfig);
router.post("/:orgId/test", SsoAdminController.testConnection);
router.get("/:orgId/sp-metadata", SsoAdminController.getSpMetadata);

export default router;
