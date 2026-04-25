import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameOtpCodeToCodeHash1777055898577 implements MigrationInterface {
    name = 'RenameOtpCodeToCodeHash1777055898577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" RENAME COLUMN "code" TO "code_hash"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "code_hash" TYPE character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "code_hash" TYPE character varying(6)`);
        await queryRunner.query(`ALTER TABLE "otp_codes" RENAME COLUMN "code_hash" TO "code"`);
    }

}
