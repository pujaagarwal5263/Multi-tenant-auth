import { Router } from "express";
import { OrgController } from "../controllers/org.controller";
import { validateCreateOrg } from "../validators/org.validator";

const router = Router();

router.post("/", validateCreateOrg, OrgController.createOrganization);

export default router;
