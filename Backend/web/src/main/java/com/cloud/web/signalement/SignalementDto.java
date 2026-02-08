package com.cloud.web.signalement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SignalementDto(
    UUID id,
    String titre,
    String description,
    BigDecimal latitude,
    BigDecimal longitude,
    BigDecimal surfaceM2,
    BigDecimal budget,
    String statut,
    String emailUtilisateur,
    LocalDateTime dateSignalement,
    String nomEntreprise,
    LocalDateTime dateEnCours,
    LocalDateTime dateTermine,
    List<String> imageUrls
) {}
