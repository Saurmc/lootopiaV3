import { HuntEntity } from './hunt.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('HuntEntity', () => {
  it('should be defined', () => {
    const hunt = new HuntEntity();
    expect(hunt).toBeDefined();
  });

  it('should be registered as a TypeORM entity on table "hunts"', () => {
    const tables = getMetadataArgsStorage().tables;
    const huntTable = tables.find((t) => t.target === HuntEntity);
    expect(huntTable).toBeDefined();
    expect(huntTable!.name).toBe('hunts');
  });

  it('should have the required columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === HuntEntity,
    );
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('partner_id');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('location');
    expect(columnNames).toContain('difficulty');
    expect(columnNames).toContain('duration');
    expect(columnNames).toContain('points');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
  });

  it('should have a ManyToOne relation to UserEntity (partner)', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === HuntEntity,
    );
    const partnerRelation = relations.find((r) => r.propertyName === 'partner');
    expect(partnerRelation).toBeDefined();
    expect(partnerRelation!.relationType).toBe('many-to-one');
  });

  it('should have a OneToMany relation to StepEntity', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === HuntEntity,
    );
    const stepsRelation = relations.find((r) => r.propertyName === 'steps');
    expect(stepsRelation).toBeDefined();
    expect(stepsRelation!.relationType).toBe('one-to-many');
  });
});
