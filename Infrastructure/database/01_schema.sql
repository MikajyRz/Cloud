CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_type AS ENUM ('VISITEUR', 'UTILISATEUR', 'MANAGER');
CREATE TYPE statut_travaux AS ENUM ('NOUVEAU', 'EN_COURS', 'TERMINE');
CREATE TYPE type_sync AS ENUM ('PUSH', 'PULL');


CREATE TABLE utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role role_type NOT NULL DEFAULT 'UTILISATEUR',
    tentatives_echouees INT DEFAULT 0,
    est_bloque BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE parametre_systeme (
    cle VARCHAR(80) PRIMARY KEY,
    valeur VARCHAR(50) NOT NULL
);


CREATE TABLE session_utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,

    CONSTRAINT fk_session_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id)
        ON DELETE CASCADE
);


CREATE TABLE entreprise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL UNIQUE,
    contact VARCHAR(100)
);


CREATE TABLE signalement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(150),
    description TEXT,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    surface_m2 NUMERIC(10,2),
    budget NUMERIC(14,2),
    statut statut_travaux DEFAULT 'NOUVEAU',
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    id_utilisateur UUID,
    id_entreprise UUID,

    CONSTRAINT fk_signalement_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id),

    CONSTRAINT fk_signalement_entreprise
        FOREIGN KEY (id_entreprise)
        REFERENCES entreprise(id)
);


CREATE TABLE historique_statut (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_signalement UUID NOT NULL,
    ancien_statut statut_travaux,
    nouveau_statut statut_travaux,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_par UUID,

    CONSTRAINT fk_hist_signalement
        FOREIGN KEY (id_signalement)
        REFERENCES signalement(id),

    CONSTRAINT fk_hist_manager
        FOREIGN KEY (modifie_par)
        REFERENCES utilisateur(id)
);


CREATE TABLE firebase_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_donnee VARCHAR(50), -- USER / SIGNALEMENT
    id_reference UUID,
    sens type_sync,
    date_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_user_email ON utilisateur(email);
CREATE INDEX idx_signalement_statut ON signalement(statut);
CREATE INDEX idx_signalement_user ON signalement(id_utilisateur);
CREATE INDEX idx_session_token ON session_utilisateur(token);



INSERT INTO utilisateur (email, mot_de_passe, role)
VALUES ('manager@clouds5.local', 'manager123', 'MANAGER');

INSERT INTO parametre_systeme VALUES
('MAX_TENTATIVES_CONNEXION', '3'),
('DUREE_SESSION_MINUTES', '30');