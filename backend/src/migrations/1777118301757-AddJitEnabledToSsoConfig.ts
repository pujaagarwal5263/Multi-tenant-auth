import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJitEnabledToSsoConfig1777118301757 implements MigrationInterface {
    name = 'AddJitEnabledToSsoConfig1777118301757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "org_sso_config" ADD "jit_enabled" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "org_sso_config" DROP COLUMN "jit_enabled"`);
    }

}
