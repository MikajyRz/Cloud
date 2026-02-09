-- Migration: Ajout des colonnes de dates de transition de statut
-- À exécuter sur la base de données PostgreSQL

ALTER TABLE signalement 
ADD COLUMN IF NOT EXISTS date_en_cours TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_termine TIMESTAMP;

-- Pour les signalements déjà terminés, estimer la date de fin (optionnel)
-- UPDATE signalement 
-- SET date_termine = date_signalement + INTERVAL '7 days'
-- WHERE statut = 'TERMINE' AND date_termine IS NULL;

-- Pour les signalements en cours, estimer la date de début (optionnel)
-- UPDATE signalement 
-- SET date_en_cours = date_signalement + INTERVAL '1 day'
-- WHERE statut = 'EN_COURS' AND date_en_cours IS NULL;

COMMENT ON COLUMN signalement.date_en_cours IS 'Date de passage au statut EN_COURS';
COMMENT ON COLUMN signalement.date_termine IS 'Date de passage au statut TERMINE';
