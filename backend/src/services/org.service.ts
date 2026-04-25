import { AppDataSource } from "../config/data-source";
import { Organization } from "../models/organization";
import { OrgAuthMethod } from "../models/org-auth-method";
import { AuthMethod } from "../types";
import { generateOrgCode } from "../utils";

interface CreateOrgInput {
  name: string;
  slug: string;
  authMethod: AuthMethod;
}

export class OrgService {
  private orgRepository = AppDataSource.getRepository(Organization);
  private authMethodRepository = AppDataSource.getRepository(OrgAuthMethod);

  async createOrganization(input: CreateOrgInput): Promise<Organization> {
    const { name, slug, authMethod } = input;

    // Check if slug already exists
    const existing = await this.orgRepository.findOne({
      where: [{ slug }],
    });

    if (existing) {
      throw new Error("Organization with this slug already exists");
    }

    // Generate unique org code with retry logic
    let orgCode = generateOrgCode();
    let codeExists = await this.orgRepository.findOne({ where: { orgCode } });
    let retries = 0;
    while (codeExists && retries < 5) {
      orgCode = generateOrgCode();
      codeExists = await this.orgRepository.findOne({ where: { orgCode } });
      retries++;
    }

    if (codeExists) {
      throw new Error("Failed to generate unique org code");
    }

    // Create organization
    const organization = this.orgRepository.create({
      name,
      slug,
      orgCode,
    });

    await this.orgRepository.save(organization);

    // Create auth method entry
    const orgAuthMethod = this.authMethodRepository.create({
      method: authMethod,
      isEnabled: true,
      organization,
    });

    await this.authMethodRepository.save(orgAuthMethod);

    return organization;
  }

  async findByOrgCode(orgCode: string): Promise<Organization | null> {
    return this.orgRepository.findOne({
      where: { orgCode },
      relations: ["authMethods"],
    });
  }
}
