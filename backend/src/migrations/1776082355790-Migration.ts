import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776082355790 implements MigrationInterface {
    name = 'Migration1776082355790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."org_auth_methods_method_enum" AS ENUM('PASSWORD', 'OTP', 'GOOGLE', 'SSO')`);
        await queryRunner.query(`CREATE TABLE "org_auth_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "method" "public"."org_auth_methods_method_enum" NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "org_id" uuid, CONSTRAINT "UQ_b70a1108c8f42fe223b61edb64a" UNIQUE ("org_id", "method"), CONSTRAINT "PK_a604072262de59adfe75399eafd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."org_sso_config_protocol_enum" AS ENUM('SAML', 'OIDC')`);
        await queryRunner.query(`CREATE TABLE "org_sso_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "protocol" "public"."org_sso_config_protocol_enum" NOT NULL, "idp_name" character varying(100) NOT NULL, "saml_config" jsonb, "oidc_config" jsonb, "org_id" uuid, CONSTRAINT "REL_8fd3a7ee7358854ff9571ec59c" UNIQUE ("org_id"), CONSTRAINT "PK_2543f43a0159ea1d9ab10621f4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "domain" character varying(255) NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "UQ_98678ed828cc71e4f8a58c95d6b" UNIQUE ("domain"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "password_hash" character varying(255) NOT NULL, CONSTRAINT "UQ_dd0918407944553611bb3eb3ddc" UNIQUE ("user_id"), CONSTRAINT "REL_dd0918407944553611bb3eb3dd" UNIQUE ("user_id"), CONSTRAINT "PK_5cadc04d03e2d9fe76e1b44eb34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER', "is_verified" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "org_id" uuid, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "provider" character varying(100) NOT NULL, "external_id" character varying(255) NOT NULL, CONSTRAINT "UQ_9263c6c7a25bb8ed35ce3b9ce01" UNIQUE ("provider", "external_id"), CONSTRAINT "PK_e23bff04e9c3e7b785e442b262c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('LOGIN', 'EMAIL_VERIFY', 'PASSWORD_RESET')`);
        await queryRunner.query(`CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying(6) NOT NULL, "purpose" "public"."otp_codes_purpose_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "org_auth_methods" ADD CONSTRAINT "FK_7844bde86fd122a5dc950e7ed66" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "org_sso_config" ADD CONSTRAINT "FK_8fd3a7ee7358854ff9571ec59cf" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_credentials" ADD CONSTRAINT "FK_dd0918407944553611bb3eb3ddc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_identities" ADD CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD CONSTRAINT "FK_318b850fc020b1e0f8670f66e12" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP CONSTRAINT "FK_318b850fc020b1e0f8670f66e12"`);
        await queryRunner.query(`ALTER TABLE "user_identities" DROP CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4"`);
        await queryRunner.query(`ALTER TABLE "user_credentials" DROP CONSTRAINT "FK_dd0918407944553611bb3eb3ddc"`);
        await queryRunner.query(`ALTER TABLE "org_sso_config" DROP CONSTRAINT "FK_8fd3a7ee7358854ff9571ec59cf"`);
        await queryRunner.query(`ALTER TABLE "org_auth_methods" DROP CONSTRAINT "FK_7844bde86fd122a5dc950e7ed66"`);
        await queryRunner.query(`DROP TABLE "otp_codes"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
        await queryRunner.query(`DROP TABLE "user_identities"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "user_credentials"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TABLE "org_sso_config"`);
        await queryRunner.query(`DROP TYPE "public"."org_sso_config_protocol_enum"`);
        await queryRunner.query(`DROP TABLE "org_auth_methods"`);
        await queryRunner.query(`DROP TYPE "public"."org_auth_methods_method_enum"`);
    }

}
