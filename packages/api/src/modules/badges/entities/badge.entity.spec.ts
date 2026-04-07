import { BadgeEntity } from './badge.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('BadgeEntity', () => {
  it('should be defined', () => {
    const badge = new BadgeEntity();
    expect(badge).toBeDefined();
  });

  it('should be registered as a TypeORM entity on table "badges"', () => {
    const tables = getMetadataArgsStorage().tables;
    const badgeTable = tables.find((t) => t.target === BadgeEntity);
    expect(badgeTable).toBeDefined();
    expect(badgeTable!.name).toBe('badges');
  });

  it('should have the required columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === BadgeEntity,
    );
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('badge_type');
    expect(columnNames).toContain('earned_at');
  });

  it('should have a ManyToOne relation to UserEntity with CASCADE', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === BadgeEntity,
    );
    const userRelation = relations.find((r) => r.propertyName === 'user');
    expect(userRelation).toBeDefined();
    expect(userRelation!.relationType).toBe('many-to-one');
  });
});
