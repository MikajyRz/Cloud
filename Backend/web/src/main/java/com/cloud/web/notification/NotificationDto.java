package com.cloud.web.notification;

import java.util.UUID;

public record NotificationDto(
    UUID id,
    String titre,
    String message,
    UUID signalementId,
    String dateCreation,
    boolean lu
) {}
