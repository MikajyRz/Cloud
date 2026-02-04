package com.cloud.web.report;

import com.cloud.web.entreprise.EntrepriseRepository;
import com.cloud.web.report.dto.PublicReportResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PublicReportController {

    private final ReportRepository reportRepository;
    private final EntrepriseRepository entrepriseRepository;

    public PublicReportController(ReportRepository reportRepository, EntrepriseRepository entrepriseRepository) {
        this.reportRepository = reportRepository;
        this.entrepriseRepository = entrepriseRepository;
    }

    @GetMapping("/reports")
    public ResponseEntity<List<PublicReportResponse>> listReports() {
        var reports = reportRepository.findAll();

        var entrepriseIds = reports.stream()
                .map(Report::getIdEntreprise)
                .filter(id -> id != null)
                .distinct()
                .toList();

        Map<UUID, String> entrepriseNomById = entrepriseRepository.findAllById(entrepriseIds)
                .stream()
                .collect(Collectors.toMap(e -> e.getId(), e -> e.getNom()));

        var rows = reports.stream()
                .map(r -> new PublicReportResponse(
                        r.getId() != null ? r.getId().toString() : null,
                        r.getLatitude() != null ? r.getLatitude().doubleValue() : null,
                        r.getLongitude() != null ? r.getLongitude().doubleValue() : null,
                        r.getSurfaceM2() != null ? r.getSurfaceM2().doubleValue() : null,
                        r.getBudget() != null ? r.getBudget().doubleValue() : null,
                        r.getStatut() != null ? r.getStatut().name() : null,
                        r.getDateSignalement() != null ? r.getDateSignalement().toString() : null,
                        r.getIdEntreprise() != null ? entrepriseNomById.get(r.getIdEntreprise()) : null
                ))
                .toList();

        return ResponseEntity.ok(rows);
    }
}
