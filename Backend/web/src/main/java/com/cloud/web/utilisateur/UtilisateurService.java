package com.cloud.web.utilisateur;

import com.cloud.web.utilisateur.dto.UpdateMeRequest;
import com.cloud.web.utilisateur.dto.UtilisateurListDto;
import com.cloud.web.utilisateur.dto.UtilisateurResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public UtilisateurService(UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UtilisateurResponse getMe(String email) {
        var utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        return mapToResponse(utilisateur);
    }

    @PreAuthorize("hasRole('MANAGER')")
    public List<UtilisateurListDto> getAllUtilisateurs() {
        return utilisateurRepository.findAll().stream()
            .map(this::mapToListDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public UtilisateurResponse updateMe(String email, UpdateMeRequest req) {
        var utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        if (req.getNomComplet() != null) {
            utilisateur.setNomComplet(req.getNomComplet());
        }
        if (req.getMotDePasse() != null && !req.getMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(req.getMotDePasse()));
        }
        utilisateurRepository.save(utilisateur);
        return mapToResponse(utilisateur);
    }

    private UtilisateurResponse mapToResponse(Utilisateur utilisateur) {
        return new UtilisateurResponse(utilisateur.getEmail(), utilisateur.getNomComplet(), utilisateur.getRole().name());
    }

    private UtilisateurListDto mapToListDto(Utilisateur utilisateur) {
        return new UtilisateurListDto(
            utilisateur.getEmail(),
            utilisateur.getNom(),
            utilisateur.getPrenom(),
            utilisateur.getRole().name(),
            utilisateur.getEstBloque() != null && utilisateur.getEstBloque(),
            utilisateur.getTentativesEchouees()
        );
    }
}
