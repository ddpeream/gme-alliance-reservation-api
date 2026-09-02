import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeriodColumn1700000000001 implements MigrationInterface {
  name = 'AddPeriodColumn1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CAMBIAR tsrange → tstzrange
    await queryRunner.query(`
            ALTER TABLE "reservations" 
            ADD COLUMN "period" tstzrange 
            GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reservations_period" 
            ON "reservations" USING gist ("period")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_reservations_period"
        `);

    await queryRunner.query(`
            ALTER TABLE "reservations" DROP COLUMN IF EXISTS "period"
        `);
  }
}
