import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776087458746 implements MigrationInterface {
    name = 'Migration1776087458746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "org_code" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "org_code" DROP NOT NULL`);
    }

}
