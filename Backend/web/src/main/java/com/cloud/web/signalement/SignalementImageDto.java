package com.cloud.web.signalement;

import java.util.UUID;

public record SignalementImageDto(
    UUID id,
    String imageUrl
) {}
