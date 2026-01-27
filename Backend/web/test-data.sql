-- Données de test pour synchronisation Firebase

-- Entreprises
INSERT INTO entreprise (nom, contact) VALUES 
('TechBuild Inc', '+509-1234-5678'),
('RoadFix SA', '+509-9876-5432'),
('UrbanWorks Ltd', '+509-5555-1111');

-- Signalements test (assure-toi que les utilisateurs existent avant)
-- Note: Remplace id_utilisateur par un email valide de la table users

-- Si tu veux lier à un utilisateur spécifique, d'abord récupère son email:
-- SELECT email FROM users WHERE email = 'manager@cloud.local';

INSERT INTO signalement (
    titre, 
    description, 
    latitude, 
    longitude, 
    surface_m2, 
    budget,
    statut
) VALUES 
(
    'Route endommagée Avenue John Brown',
    'Multiples nids de poule sur 200m, circulation difficile',
    18.556789,
    -72.384123,
    200.50,
    75000.00,
    'NOUVEAU'
),
(
    'Feu de signalisation hors service',
    'Intersection Rue Capois / Avenue Martin Luther King - feu éteint depuis 3 jours',
    18.557123,
    -72.385456,
    0,
    15000.00,
    'EN_COURS'
),
(
    'Trottoir détruit près Marché',
    'Trottoir complètement cassé, danger pour piétons',
    18.558234,
    -72.386789,
    50.00,
    25000.00,
    'NOUVEAU'
),
(
    'Poteau électrique penché',
    'Risque de chute, câbles exposés',
    18.559345,
    -72.387012,
    0,
    40000.00,
    'NOUVEAU'
);

-- Vérifier les insertions
SELECT COUNT(*) as nb_entreprises FROM entreprise;
SELECT COUNT(*) as nb_signalements FROM signalement;
SELECT statut, COUNT(*) FROM signalement GROUP BY statut;

