-- Données de test pour synchronisation Firebase

-- Entreprises
INSERT INTO entreprise (nom, contact) VALUES 
('TechBuild Inc', '+509-1234-5678'),
('RoadFix SA', '+509-9876-5432'),
('UrbanWorks Ltd', '+509-5555-1111');

-- Signalements test (assure-toi que les utilisateurs existent avant)
-- Note: Remplace id_utilisateur par un email valide de la table utilisateur

-- Si tu veux lier à un utilisateur spécifique, d'abord récupère son email:
-- SELECT email FROM utilisateur WHERE email = 'manager@cloud.local';

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
    'Nids de poule Avenue de l''Independence',
    'Multiples nids de poule sur 150m, circulation difficile',
    -18.8792,
    47.5079,
    150.00,
    85000.00,
    'NOUVEAU'
),
(
    'Feu de signalisation defectueux Analakely',
    'Intersection principale Analakely - feu eteint depuis 2 jours',
    -18.9110,
    47.5204,
    0,
    12000.00,
    'EN_COURS'
),
(
    'Trottoir endommage Rue Rainitovo',
    'Trottoir completement casse, danger pour pietons',
    -18.9065,
    47.5236,
    45.00,
    28000.00,
    'EN_COURS'
),
(
    'Caniveau bouche Ambohijatovo',
    'Risque d''inondation en saison des pluies',
    -18.9147,
    47.5311,
    80.00,
    35000.00,
    'NOUVEAU'
),
(
    'Route degradee vers Ivato',
    'Revetement completement detruit sur 500m',
    -18.7967,
    47.4789,
    500.00,
    150000.00,
    'EN_COURS'
),
(
    'Eclairage public defaillant Ankorondrano',
    'Zone sans eclairage sur 300m, risque securitaire',
    -18.9012,
    47.5178,
    0,
    45000.00,
    'EN_COURS'
),
(
    'Pont endommage Ambatobe',
    'Fissures importantes sur le pont',
    -18.8534,
    47.5412,
    120.00,
    95000.00,
    'NOUVEAU'
),
(
    'Marquage routier efface 67 Ha',
    'Passages pietons et lignes de circulation invisibles',
    -18.8923,
    47.5289,
    200.00,
    25000.00,
    'TERMINE'
),
(
    'Trou profond Route Digue',
    'Trou de 2m de profondeur tres dangereux',
    -18.8845,
    47.5123,
    15.00,
    18000.00,
    'EN_COURS'
),
(
    'Panneau de signalisation arrache Behoririka',
    'Panneau stop manquant a intersection dangereuse',
    -18.9089,
    47.5267,
    0,
    5000.00,
    'TERMINE'
),
(
    'Chaussee affaissee Ambohimanarina',
    'Affaissement important de la chaussee',
    -18.8678,
    47.5534,
    75.00,
    65000.00,
    'EN_COURS'
),
(
    'Egout a ciel ouvert Isotry',
    'Danger sanitaire et securitaire',
    -18.9234,
    47.5298,
    30.00,
    42000.00,
    'NOUVEAU'
);

-- Vérifier les insertions
SELECT COUNT(*) as nb_entreprises FROM entreprise;
SELECT COUNT(*) as nb_signalements FROM signalement;
SELECT statut, COUNT(*) FROM signalement GROUP BY statut;

