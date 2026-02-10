package com.cloud.web.signalement;

import java.math.BigDecimal;

public record UpdateSignalementRequest(
    BigDecimal surfaceM2,
    Integer niveau,
    BigDecimal budget,
    String nomEntreprise,
    String statut
) {}
