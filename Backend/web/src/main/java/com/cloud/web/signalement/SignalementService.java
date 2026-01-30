package com.cloud.web.signalement;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SignalementService {

    private final SignalementRepository signalementRepository;

    public SignalementService(SignalementRepository signalementRepository) {
        this.signalementRepository = signalementRepository;
    }

    // Public pour afficher sur la carte
    public List<SignalementDto> getAllSignalements() {
        return signalementRepository.findAll().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public SignalementStatsDto getStatistiques() {
        List<Signalement> all = signalementRepository.findAll();
        
        long total = all.size();
        BigDecimal surfaceTotale = all.stream()
            .filter(s -> s.getSurfaceM2() != null)
            .map(Signalement::getSurfaceM2)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal budgetTotal = all.stream()
            .filter(s -> s.getBudget() != null)
            .map(Signalement::getBudget)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long termine = all.stream().filter(s -> s.getStatut() == StatutTravaux.TERMINE).count();
        long nouveau = all.stream().filter(s -> s.getStatut() == StatutTravaux.NOUVEAU).count();
        long enAttente = all.stream().filter(s -> s.getStatut() == StatutTravaux.EN_ATTENTE).count();
        long enCours = all.stream().filter(s -> s.getStatut() == StatutTravaux.EN_COURS).count();
        long annule = all.stream().filter(s -> s.getStatut() == StatutTravaux.ANNULE).count();
        
        double avancement = total > 0 ? (termine * 100.0) / total : 0.0;
        
        return new SignalementStatsDto(
            total,
            surfaceTotale,
            budgetTotal,
            avancement,
            nouveau,
            enAttente,
            enCours,
            termine,
            annule
        );
    }

    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public SignalementDto updateStatut(UUID id, String statutStr) {
        var signalement = signalementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        try {
            StatutTravaux newStatut = StatutTravaux.valueOf(statutStr);
            signalement.setStatut(newStatut);
            signalementRepository.save(signalement);
            return toDto(signalement);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut invalide: " + statutStr);
        }
    }

    private SignalementDto toDto(Signalement signalement) {
        return new SignalementDto(
            signalement.getId(),
            signalement.getTitre(),
            signalement.getDescription(),
            signalement.getLatitude(),
            signalement.getLongitude(),
            signalement.getSurfaceM2(),
            signalement.getBudget(),
            signalement.getStatut().name(),
            signalement.getUtilisateur() != null ? signalement.getUtilisateur().getEmail() : null,
            signalement.getDateSignalement(),
            signalement.getEntreprise() != null ? signalement.getEntreprise().getNom() : null
        );
    }
}
