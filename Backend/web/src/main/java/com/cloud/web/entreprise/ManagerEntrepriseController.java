package com.cloud.web.entreprise;

import com.cloud.web.entreprise.dto.EntrepriseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerEntrepriseController {

    private final EntrepriseRepository entrepriseRepository;

    public ManagerEntrepriseController(EntrepriseRepository entrepriseRepository) {
        this.entrepriseRepository = entrepriseRepository;
    }

    @GetMapping("/entreprises")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<EntrepriseResponse>> listEntreprises() {
        var rows = entrepriseRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Entreprise::getNom, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(e -> new EntrepriseResponse(
                        e.getId() != null ? e.getId().toString() : null,
                        e.getNom()
                ))
                .toList();

        return ResponseEntity.ok(rows);
    }
}
