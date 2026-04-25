import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgCode1776082400000 implements MigrationInterface {
    name = 'AddOrgCode1776082400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ADD "org_code" character varying(6)`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "UQ_organizations_org_code" UNIQUE ("org_code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "UQ_organizations_org_code"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "org_code"`);
    }
}
