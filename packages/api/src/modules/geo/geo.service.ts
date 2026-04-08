import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface NearbyHuntRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: string | null;
  duration: number | null;
  points: number;
  is_active: boolean;
  partner_id: string;
  created_at: Date;
  distance_meters: number;
}

@Injectable()
export class GeoService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retourne les chasses actives dans un rayon donné (mètres)
   * autour d'un point GPS (lat, lng), triées par distance croissante.
   * Utilise PostGIS ST_DWithin sur la colonne coordinates des hunts.
   *
   * Note RGPD : les coordonnées du joueur ne sont jamais stockées.
   */
  async findHuntsNearby(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<NearbyHuntRow[]> {
    return this.dataSource.query(
      `
      SELECT
        h.id,
        h.title,
        h.description,
        h.location,
        h.difficulty,
        h.duration,
        h.points,
        h.is_active,
        h.partner_id,
        h.created_at,
        ST_Distance(
          h.coordinates::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) AS distance_meters
      FROM hunts h
      WHERE h.is_active = true
        AND h.coordinates IS NOT NULL
        AND ST_DWithin(
          h.coordinates::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
      ORDER BY distance_meters ASC
      `,
      [lat, lng, radiusMeters],
    );
  }
}
