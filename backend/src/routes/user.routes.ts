import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { validateCreateUser } from "../validators/user.validator";

const router = Router();

router.post("/", validateCreateUser, UserController.createUser);

export default router;