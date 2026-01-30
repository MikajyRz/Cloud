package com.cloud.web.signalement;

import java.math.BigDecimal;

public record SignalementStatsDto(
    long nombreTotal,
    BigDecimal surfaceTotale,
    BigDecimal budgetTotal,
    double avancementPourcentage,
    long nombreNouveau,
    long nombreEnAttente,
    long nombreEnCours,
    long nombreTermine,
    long nombreAnnule
) {}
