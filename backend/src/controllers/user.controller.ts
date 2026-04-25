import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserRole } from "../types";

const userService = new UserService();

export class UserController {
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, role, orgId } = req.body;

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`,
        });
        return;
      }

      const user = await userService.createUser({
        name,
        email,
        role,
        orgCode: orgId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
}
