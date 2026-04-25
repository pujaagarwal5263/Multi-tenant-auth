import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOrgDomain1776090000000 implements MigrationInterface {
    name = 'RemoveOrgDomain1776090000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "domain"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ADD COLUMN "domain" varchar(255) UNIQUE`);
    }
}
