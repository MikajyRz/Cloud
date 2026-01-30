CREATE VIEW v_carte_signalements AS
SELECT
    id,
    latitude,
    longitude,
    statut,
    surface_m2,
    budget,
    date_signalement
FROM signalement;


CREATE VIEW v_recap_global AS
SELECT
    COUNT(*) AS nb_signalements,
    COALESCE(SUM(surface_m2),0) AS surface_totale,
    COALESCE(SUM(budget),0) AS budget_total,
    ROUND(
        (SUM(CASE WHEN statut = 'TERMINE' THEN 1 ELSE 0 END)::DECIMAL
        / NULLIF(COUNT(*),0)) * 100,
        2
    ) AS avancement_pourcent
FROM signalement;

-- Mobile
CREATE VIEW v_mes_signalements AS
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
    p_nouveau_statut statut_travaux,
    p_manager UUID
)
RETURNS VOID AS $$
DECLARE ancien statut_travaux;
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

