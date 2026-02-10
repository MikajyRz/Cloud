CREATE OR REPLACE VIEW v_carte_signalements AS
SELECT
    s.id,
    s.latitude,
    s.longitude,
    s.surface_m2,
    s.budget,
    s.statut,
    s.date_signalement,
    s.image_urls,
    e.nom AS entreprise_nom
FROM signalement s
LEFT JOIN entreprise e ON s.id_entreprise = e.id;

CREATE OR REPLACE VIEW v_recap_global AS
SELECT
    COUNT(*) AS nombre_points,
    COALESCE(SUM(s.surface_m2), 0) AS surface_totale,
    COALESCE(SUM(s.budget), 0) AS budget_total,
    ROUND(AVG(
        CASE s.statut
            WHEN 'NOUVEAU' THEN 0
            WHEN 'EN_COURS' THEN 50
            WHEN 'TERMINE' THEN 100
            ELSE 0
        END
    ), 1) AS avancement_pct
FROM signalement s;

-- Mobile
CREATE OR REPLACE VIEW v_mes_signalements AS
SELECT *
FROM signalement;

CREATE OR REPLACE FUNCTION debloquer_utilisateur(p_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE utilisateur
    SET est_bloque = FALSE,
        tentatives_echouees = 0
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION changer_statut_travaux(
    p_id_signalement UUID,
    p_nouveau_statut statuttravaux,
    p_manager UUID
)
RETURNS VOID AS $$
DECLARE ancien statuttravaux;
BEGIN
    SELECT statut INTO ancien
    FROM signalement
    WHERE id = p_id_signalement;

    UPDATE signalement
    SET statut = p_nouveau_statut
    WHERE id = p_id_signalement;

    INSERT INTO historique_statut
    (id_signalement, ancien_statut, nouveau_statut, modifie_par)
    VALUES (p_id_signalement, ancien, p_nouveau_statut, p_manager);
END;
$$ LANGUAGE plpgsql;