import { Request, Response } from "express";
import { OrgService } from "../services/org.service";
import { AuthMethod } from "../types";

const orgService = new OrgService();

export class OrgController {
  static async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug, authMethod } = req.body;

      // Validate authMethod
      if (!Object.values(AuthMethod).includes(authMethod)) {
        res.status(400).json({
          success: false,
          message: `Invalid auth method. Must be one of: ${Object.values(AuthMethod).join(", ")}`,
        });
        return;
      }

      const organization = await orgService.createOrganization({
        name,
        slug,
        authMethod,
      });

      res.status(201).json({
        success: true,
        data: {
          id: organization.orgCode,
          name: organization.name,
          slug: organization.slug,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create organization";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
}
