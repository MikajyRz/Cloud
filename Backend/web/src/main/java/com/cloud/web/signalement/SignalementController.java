package com.cloud.web.signalement;

import com.cloud.web.entreprise.Entreprise;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "http://localhost:5173")
public class SignalementController {

    private final SignalementService signalementService;

    public SignalementController(SignalementService signalementService) {
        this.signalementService = signalementService;
    }

    @GetMapping
    public ResponseEntity<List<SignalementDto>> getAllSignalements() {
        return ResponseEntity.ok(signalementService.getAllSignalements());
    }

    @GetMapping("/stats")
    public ResponseEntity<SignalementStatsDto> getStatistiques() {
        return ResponseEntity.ok(signalementService.getStatistiques());
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<SignalementDto> updateStatut(
        @PathVariable UUID id,
        @RequestBody UpdateStatutRequest request
    ) {
        return ResponseEntity.ok(signalementService.updateStatut(id, request.statut()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SignalementDto> updateSignalement(
        @PathVariable UUID id,
        @RequestBody UpdateSignalementRequest request
    ) {
        return ResponseEntity.ok(signalementService.updateSignalement(id, request));
    }

    @GetMapping("/entreprises")
    public ResponseEntity<List<Entreprise>> getEntreprises() {
        return ResponseEntity.ok(signalementService.getAllEntreprises());
    }
}
