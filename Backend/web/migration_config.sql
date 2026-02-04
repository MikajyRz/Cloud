-- Table de configuration applicative
CREATE TABLE IF NOT EXISTS app_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    updated_at TIMESTAMP
);

-- Insertion des configurations par défaut
INSERT INTO app_config (config_key, config_value, description, updated_at)
VALUES 
    ('session.duration.minutes', '30', 'Durée de vie des sessions en minutes', NOW()),
    ('auth.max.login.attempts', '3', 'Nombre maximum de tentatives de connexion avant blocage', NOW())
ON CONFLICT (config_key) DO NOTHING;
