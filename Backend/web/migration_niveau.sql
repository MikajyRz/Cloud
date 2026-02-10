-- Migration : Ajout du champ niveau et configuration prix_par_m2
-- Date: 2026-02-10

-- Ajouter la colonne niveau à la table signalement
ALTER TABLE signalement ADD COLUMN IF NOT EXISTS niveau INTEGER;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN signalement.niveau IS 'Niveau de réparation de 1 à 10 pour catégoriser la complexité';

-- Ajouter une contrainte pour s'assurer que le niveau est entre 1 et 10
ALTER TABLE signalement ADD CONSTRAINT check_niveau_range 
    CHECK (niveau IS NULL OR (niveau >= 1 AND niveau <= 10));

-- Insérer la configuration pour le prix par m²
INSERT INTO app_config (config_key, config_value, description) 
VALUES ('prix.par.m2', '100', 'Prix forfaitaire par m² pour le calcul du budget (€/m²)')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée : colonne niveau ajoutée et configuration prix_par_m2 créée';
END $$;
