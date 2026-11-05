-- Textes alternatifs des photos : retrait de la mention « visuel d'illustration » (demande de la boutique, 05/11/2026).
UPDATE "ProductImage"
SET "alt" = replace(replace("alt", ' — autre coloris (visuel d''illustration)', ' — autre coloris'), ' — visuel d''illustration', '')
WHERE "alt" LIKE '%illustration%';
