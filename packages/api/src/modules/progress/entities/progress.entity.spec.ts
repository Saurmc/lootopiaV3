import { ProgressEntity } from './progress.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('ProgressEntity', () => {
  it('should be defined', () => {
    const progress = new ProgressEntity();
    expect(progress).toBeDefined();
  });

  it('should be registered as a TypeORM entity on table "progress"', () => {
    const tables = getMetadataArgsStorage().tables;
    const progressTable = tables.find((t) => t.target === ProgressEntity);
    expect(progressTable).toBeDefined();
    expect(progressTable!.name).toBe('progress');
  });

  it('should have the required columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === ProgressEntity,
    );
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('hunt_id');
    expect(columnNames).toContain('current_step');
    expect(columnNames).toContain('completed_steps');
    expect(columnNames).toContain('total_points');
    expect(columnNames).toContain('started_at');
    expect(columnNames).toContain('completed_at');
  });

  it('should have ManyToOne relations to User and Hunt with CASCADE', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === ProgressEntity,
    );
    const userRelation = relations.find((r) => r.propertyName === 'user');
    const huntRelation = relations.find((r) => r.propertyName === 'hunt');
    expect(userRelation).toBeDefined();
    expect(huntRelation).toBeDefined();
    expect(userRelation!.relationType).toBe('many-to-one');
    expect(huntRelation!.relationType).toBe('many-to-one');
  });
});
