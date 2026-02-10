INSERT INTO entreprise (id, nom, contact) VALUES
    (gen_random_uuid(), 'Colas Madagascar', 'contact@colas.mg'),
    (gen_random_uuid(), 'SOGEA SATOM', 'info@sogea-satom.mg'),
    (gen_random_uuid(), 'Entreprise REDO', 'contact@redo.mg');

-- Configuration application
INSERT INTO app_config (config_key, config_value, description, updated_at) VALUES
    ('session.duration.minutes', '30', 'Durée de session en minutes', NOW()),
    ('auth.max.login.attempts', '3', 'Nombre maximum de tentatives de connexion', NOW());

-- ============================================================
-- DONNÉES DE TEST (signalements à Antananarivo)
-- ============================================================

INSERT INTO signalement (id, titre, description, latitude, longitude, surface_m2, budget, statut, date_signalement)
VALUES
    (gen_random_uuid(), 'Nid-de-poule Analakely', 'Route principale endommagée', -18.9100, 47.5255, 15.5, 2500000, 'NOUVEAU', NOW()),
    (gen_random_uuid(), 'Fissure route Ambodivona', 'Fissures profondes sur la chaussée', -18.9050, 47.5300, 25.0, 4000000, 'EN_COURS', NOW()),
    (gen_random_uuid(), 'Trou Isotry', 'Gros trou dangereux', -18.9130, 47.5190, 8.0, 1200000, 'NOUVEAU', NOW()),
    (gen_random_uuid(), 'Dégradation Anosy', 'Revêtement dégradé près du lac', -18.9200, 47.5280, 30.0, 5500000, 'TERMINE', NOW()),
    (gen_random_uuid(), 'Affaissement Tsaralalana', 'Affaissement de la route', -18.9080, 47.5230, 12.0, 3000000, 'EN_COURS', NOW());
