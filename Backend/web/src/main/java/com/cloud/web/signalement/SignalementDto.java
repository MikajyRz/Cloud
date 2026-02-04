package com.cloud.web.signalement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

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
    List<SignalementImageDto> images
) {}
