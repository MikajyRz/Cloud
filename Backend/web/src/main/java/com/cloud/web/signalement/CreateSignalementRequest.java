package com.cloud.web.signalement;

import java.math.BigDecimal;
import java.util.List;

public record CreateSignalementRequest(
    String titre,
    String description,
    BigDecimal latitude,
    BigDecimal longitude,
    BigDecimal surfaceM2,
    BigDecimal budget,
    List<String> imageUrls
) {}
