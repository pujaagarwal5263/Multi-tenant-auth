import { AppDataSource } from "../config/data-source";
import { User } from "../models/user";
import { Organization } from "../models/organization";
import { OrgAuthMethod } from "../models/org-auth-method";
import { UserRole, AuthMethod } from "../types";

interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  orgCode: string;
}

export interface UserWithAuthMethod {
  user: User;
  authMethodEnabled: boolean;
}

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private orgRepository = AppDataSource.getRepository(Organization);
  private authMethodRepository = AppDataSource.getRepository(OrgAuthMethod);

  async createUser(input: CreateUserInput): Promise<User> {
    const { name, email, role, orgCode } = input;

    // Find organization by orgCode
    const organization = await this.orgRepository.findOne({
      where: { orgCode },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if user with email already exists (globally unique)
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user with is_verified = false
    const user = this.userRepository.create({
      name,
      email,
      role,
      isVerified: false,
      organization,
    });

    await this.userRepository.save(user);

    return user;
  }

  async findByEmail(email: string, orgId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        email,
        organization: { id: orgId },
      },
      relations: ["organization"],
    });
  }

  async findUserWithAuthMethod(
    email: string,
    method: AuthMethod
  ): Promise<UserWithAuthMethod | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["organization", "credential"],
    });

    if (!user) {
      return null;
    }

    const authMethod = await this.authMethodRepository.findOne({
      where: {
        organization: { id: user.organization.id },
        method,
        isEnabled: true,
      },
    });

    return {
      user,
      authMethodEnabled: !!authMethod,
    };
  }

  async getAuthMethodsForUser(email: string): Promise<AuthMethod[] | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["organization"],
    });

    if (!user) {
      return null;
    }

    const authMethods = await this.authMethodRepository.find({
      where: {
        organization: { id: user.organization.id },
        isEnabled: true,
      },
    });

    return authMethods.map((am) => am.method);
  }
}
