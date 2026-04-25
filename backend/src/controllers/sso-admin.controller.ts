import { Request, Response } from "express";
import { SsoAdminService } from "../services/sso-admin.service";

const ssoAdminService = new SsoAdminService();

export class SsoAdminController {
  static async configureSso(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.params.orgId;
      const config = req.body;

      const ssoConfig = await ssoAdminService.configureSso(orgId, config);

      res.status(200).json({
        success: true,
        message: "SSO configuration saved successfully",
        data: {
          id: ssoConfig.id,
          protocol: ssoConfig.protocol,
          idpName: ssoConfig.idpName,
          jitEnabled: ssoConfig.jitEnabled,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to configure SSO";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async getSsoConfig(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.params.orgId;

      const config = await ssoAdminService.getSsoConfig(orgId);

      if (!config) {
        res.status(404).json({
          success: false,
          message: "SSO configuration not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get SSO configuration";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async deleteSsoConfig(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.params.orgId;

      await ssoAdminService.deleteSsoConfig(orgId);

      res.status(200).json({
        success: true,
        message: "SSO configuration deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete SSO configuration";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.params.orgId;

      const result = await ssoAdminService.testSsoConnection(orgId);

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async getSpMetadata(req: Request, res: Response): Promise<void> {
    try {
      const orgId = req.params.orgId;

      const metadata = ssoAdminService.getSpMetadata(orgId);

      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get SP metadata";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
}
