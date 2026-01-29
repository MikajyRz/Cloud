package com.cloud.web.report;

import com.cloud.web.report.dto.SyncReportsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
public class ManagerSyncController {

    private final ReportSyncService reportSyncService;

    public ManagerSyncController(ReportSyncService reportSyncService) {
        this.reportSyncService = reportSyncService;
    }

    @PostMapping("/sync-reports")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SyncReportsResponse> syncReports() {
        return ResponseEntity.ok(reportSyncService.sync());
    }
}
