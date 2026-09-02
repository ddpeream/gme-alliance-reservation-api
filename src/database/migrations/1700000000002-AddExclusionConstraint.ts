import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExclusionConstraint1700000000002 implements MigrationInterface {
  name = 'AddExclusionConstraint1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensión btree_gist
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS btree_gist
        `);

    // Agregar Exclusion Constraint
    await queryRunner.query(`
            ALTER TABLE "reservations" 
            ADD CONSTRAINT "no_overlapping_reservations" 
            EXCLUDE USING gist (
                resource_id WITH =,
                period WITH &&
            ) WHERE (status = 'confirmed')
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "reservations" 
            DROP CONSTRAINT IF EXISTS "no_overlapping_reservations"
        `);
  }
}
