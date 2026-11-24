-- Rayons Hommes / Femmes / Enfants.
CREATE TYPE "Audience" AS ENUM ('MEN', 'WOMEN', 'KIDS', 'UNISEX');

ALTER TABLE "Product" ADD COLUMN "audience" "Audience" NOT NULL DEFAULT 'UNISEX';

CREATE INDEX "Product_audience_status_idx" ON "Product"("audience", "status");

-- Classement du catalogue déjà installé (même contenu que data/catalogue-audience.csv, réappliqué à chaque import).
UPDATE "Product" SET "audience" = 'WOMEN' WHERE "reference" IN ('GLA-001', 'GLA-002', 'GLA-003', 'GLA-043', 'GLA-044', 'GLA-047', 'GLA-048', 'GLA-057');
UPDATE "Product" SET "audience" = 'KIDS' WHERE "reference" IN ('GLA-011', 'GLA-012', 'GLA-039', 'GLA-049', 'GLA-050');
UPDATE "Product" SET "audience" = 'MEN' WHERE "reference" IN ('GLA-013', 'GLA-014', 'GLA-015', 'GLA-016', 'GLA-017', 'GLA-018', 'GLA-040', 'GLA-041', 'GLA-042', 'GLA-045', 'GLA-046', 'GLA-051', 'GLA-052', 'GLA-053', 'GLA-054', 'GLA-055');
