package com.cloud.web.report.dto;

public record PublicReportResponse(
        String id,
        Double latitude,
        Double longitude,
        Double surfaceM2,
        Double budget,
        String statut,
        String dateSignalement,
        String entrepriseNom
) {
}
