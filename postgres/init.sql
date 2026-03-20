-- Activation de PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Les tables seront créées par TypeORM (synchronize: true en dev)
-- Ce fichier sert uniquement à initialiser les extensions nécessaires.
