import { StepEntity } from './step.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('StepEntity', () => {
  it('should be defined', () => {
    const step = new StepEntity();
    expect(step).toBeDefined();
  });

  it('should be registered as a TypeORM entity on table "steps"', () => {
    const tables = getMetadataArgsStorage().tables;
    const stepTable = tables.find((t) => t.target === StepEntity);
    expect(stepTable).toBeDefined();
    expect(stepTable!.name).toBe('steps');
  });

  it('should have the required columns including PostGIS location', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === StepEntity,
    );
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('hunt_id');
    expect(columnNames).toContain('order');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('location');
    expect(columnNames).toContain('validation_radius');
    expect(columnNames).toContain('ar_content');
    expect(columnNames).toContain('created_at');
  });

  it('should have location column typed as geography', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === StepEntity && c.propertyName === 'location',
    );
    expect(columns.length).toBe(1);
    expect(columns[0].options.type).toBe('geography');
    expect(columns[0].options.spatialFeatureType).toBe('Point');
    expect(columns[0].options.srid).toBe(4326);
  });

  it('should have a ManyToOne relation to HuntEntity with CASCADE delete', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === StepEntity,
    );
    const huntRelation = relations.find((r) => r.propertyName === 'hunt');
    expect(huntRelation).toBeDefined();
    expect(huntRelation!.relationType).toBe('many-to-one');
  });
});
