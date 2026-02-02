package com.cloud.web.report;

import com.cloud.web.report.dto.ManagerReportResponse;
import com.cloud.web.report.dto.UpdateReportRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
public class ManagerReportController {

    private final ReportRepository reportRepository;

    public ManagerReportController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<ManagerReportResponse>> listReports() {
        var rows = reportRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Report::getDateSignalement, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> new ManagerReportResponse(
                        r.getId() != null ? r.getId().toString() : null,
                        r.getFirestoreId(),
                        r.getTitre(),
                        r.getDescription(),
                        r.getLatitude() != null ? r.getLatitude().doubleValue() : null,
                        r.getLongitude() != null ? r.getLongitude().doubleValue() : null,
                        r.getSurfaceM2() != null ? r.getSurfaceM2().doubleValue() : null,
                        r.getBudget() != null ? r.getBudget().doubleValue() : null,
                        r.getStatut(),
                        r.getDateSignalement() != null ? r.getDateSignalement().toString() : null,
                        r.getIdUtilisateur() != null ? r.getIdUtilisateur().toString() : null,
                        r.getIdEntreprise() != null ? r.getIdEntreprise().toString() : null
                ))
                .toList();

        return ResponseEntity.ok(rows);
    }

    @PatchMapping("/reports/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public ResponseEntity<ManagerReportResponse> updateReport(@PathVariable("id") UUID id, @RequestBody UpdateReportRequest req) {
        Report r = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if (req.getSurfaceM2() != null) {
            r.setSurfaceM2(BigDecimal.valueOf(req.getSurfaceM2()));
        } else {
            r.setSurfaceM2(null);
        }

        if (req.getBudget() != null) {
            r.setBudget(BigDecimal.valueOf(req.getBudget()));
        } else {
            r.setBudget(null);
        }

        if (req.getIdEntreprise() != null && !req.getIdEntreprise().isBlank()) {
            r.setIdEntreprise(UUID.fromString(req.getIdEntreprise()));
        } else {
            r.setIdEntreprise(null);
        }

        if (req.getStatut() != null) {
            r.setStatut(req.getStatut());
        }

        reportRepository.save(r);

        return ResponseEntity.ok(new ManagerReportResponse(
                r.getId() != null ? r.getId().toString() : null,
                r.getFirestoreId(),
                r.getTitre(),
                r.getDescription(),
                r.getLatitude() != null ? r.getLatitude().doubleValue() : null,
                r.getLongitude() != null ? r.getLongitude().doubleValue() : null,
                r.getSurfaceM2() != null ? r.getSurfaceM2().doubleValue() : null,
                r.getBudget() != null ? r.getBudget().doubleValue() : null,
                r.getStatut(),
                r.getDateSignalement() != null ? r.getDateSignalement().toString() : null,
                r.getIdUtilisateur() != null ? r.getIdUtilisateur().toString() : null,
                r.getIdEntreprise() != null ? r.getIdEntreprise().toString() : null
        ));
    }
}
