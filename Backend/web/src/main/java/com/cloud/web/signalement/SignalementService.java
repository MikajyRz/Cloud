package com.cloud.web.signalement;

import com.cloud.web.config.AppConfigRepository;
import com.cloud.web.entreprise.Entreprise;
import com.cloud.web.entreprise.EntrepriseRepository;
import com.cloud.web.notification.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final NotificationService notificationService;
    private final AppConfigRepository configRepository;

    public SignalementService(SignalementRepository signalementRepository, 
                              EntrepriseRepository entrepriseRepository,
                              NotificationService notificationService,
                              AppConfigRepository configRepository) {
        this.signalementRepository = signalementRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.notificationService = notificationService;
        this.configRepository = configRepository;
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
        
        // Calcul avancement pondéré : NOUVEAU=0%, EN_COURS=50%, TERMINE=100%
        double avancement = 0.0;
        if (total > 0) {
            double totalProgress = (nouveau * 0.0) + (enAttente * 0.0) + (enCours * 50.0) + (termine * 100.0) + (annule * 0.0);
            avancement = totalProgress / total;
        }
        
        // Calcul délai moyen de traitement (en jours) pour les signalements terminés
        Double delaiMoyen = null;
        List<Signalement> termines = all.stream()
            .filter(s -> s.getStatut() == StatutTravaux.TERMINE 
                && s.getDateSignalement() != null 
                && s.getDateTermine() != null)
            .toList();
        
        if (!termines.isEmpty()) {
            long totalJours = termines.stream()
                .mapToLong(s -> java.time.temporal.ChronoUnit.DAYS.between(
                    s.getDateSignalement(),
                    s.getDateTermine()
                ))
                .sum();
            delaiMoyen = (double) totalJours / termines.size();
        }
        
        return new SignalementStatsDto(
            total,
            surfaceTotale,
            budgetTotal,
            avancement,
            nouveau,
            enAttente,
            enCours,
            termine,
            annule,
            delaiMoyen
        );
    }

    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public SignalementDto updateStatut(UUID id, String statutStr) {
        var signalement = signalementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        try {
            StatutTravaux oldStatut = signalement.getStatut();
            StatutTravaux newStatut = StatutTravaux.valueOf(statutStr);
            
            // Mettre à jour les dates selon le nouveau statut
            if (newStatut == StatutTravaux.EN_COURS && oldStatut != StatutTravaux.EN_COURS) {
                signalement.setDateEnCours(LocalDateTime.now());
            } else if (newStatut == StatutTravaux.TERMINE && oldStatut != StatutTravaux.TERMINE) {
                signalement.setDateTermine(LocalDateTime.now());
            }
            
            signalement.setStatut(newStatut);
            signalementRepository.save(signalement);
            
            // Créer une notification pour tous les utilisateurs mobiles
            if (oldStatut != newStatut) {
                notificationService.creerNotificationChangementStatut(
                    signalement.getId(),
                    signalement.getTitre(),
                    oldStatut.name(),
                    newStatut.name()
                );
            }
            
            return toDto(signalement);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut invalide: " + statutStr);
        }
    }

    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public SignalementDto updateSignalement(UUID id, UpdateSignalementRequest request) {
        var signalement = signalementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        // SÉCURITÉ : Ne jamais modifier le champ utilisateur d'origine lors d'une mise à jour !
        // Ce champ doit rester celui du créateur initial du signalement.
        // Si une requête tente de le modifier, on ignore la modification.

        if (request.surfaceM2() != null) {
            signalement.setSurfaceM2(request.surfaceM2());
        }
        if (request.niveau() != null) {
            signalement.setNiveau(request.niveau());
        }
        
        // Calcul automatique du budget si niveau et surface sont définis
        if (request.budget() != null) {
            signalement.setBudget(request.budget());
        } else if (signalement.getSurfaceM2() != null && signalement.getNiveau() != null) {
            // Récupérer le prix par m2 depuis la configuration
            BigDecimal prixParM2 = configRepository.findByConfigKey("prix.par.m2")
                .map(c -> new BigDecimal(c.getConfigValue()))
                .orElse(new BigDecimal("100")); // Valeur par défaut
            
            BigDecimal budget = signalement.getSurfaceM2()
                .multiply(BigDecimal.valueOf(signalement.getNiveau()))
                .multiply(prixParM2);
            signalement.setBudget(budget);
        }
        if (request.nomEntreprise() != null && !request.nomEntreprise().isEmpty()) {
            Entreprise entreprise = entrepriseRepository.findByNom(request.nomEntreprise())
                .orElseGet(() -> {
                    Entreprise e = new Entreprise();
                    e.setNom(request.nomEntreprise());
                    return entrepriseRepository.save(e);
                });
            signalement.setEntreprise(entreprise);
        }
        if (request.statut() != null && !request.statut().isEmpty()) {
            StatutTravaux oldStatut = signalement.getStatut();
            StatutTravaux newStatut = StatutTravaux.valueOf(request.statut());
            if (newStatut == StatutTravaux.EN_COURS && oldStatut != StatutTravaux.EN_COURS) {
                signalement.setDateEnCours(LocalDateTime.now());
            } else if (newStatut == StatutTravaux.TERMINE && oldStatut != StatutTravaux.TERMINE) {
                signalement.setDateTermine(LocalDateTime.now());
            }
            signalement.setStatut(newStatut);
            // Créer une notification pour le changement de statut
            if (oldStatut != newStatut) {
                notificationService.creerNotificationChangementStatut(
                    signalement.getId(),
                    signalement.getTitre(),
                    oldStatut.name(),
                    newStatut.name()
                );
            }
        }

        // Vérification explicite : on ne touche jamais à signalement.setUtilisateur() ici !

        signalementRepository.save(signalement);
        return toDto(signalement);
    }

    public List<Entreprise> getAllEntreprises() {
        return entrepriseRepository.findAll();
    }

    private SignalementDto toDto(Signalement signalement) {
        // Convertir le JSON stocké en List<String>
        List<String> imageUrls = null;
        if (signalement.getImageUrls() != null && !signalement.getImageUrls().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                imageUrls = mapper.readValue(signalement.getImageUrls(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            } catch (Exception e) {
                imageUrls = null;
            }
        }
        
        return new SignalementDto(
            signalement.getId(),
            signalement.getTitre(),
            signalement.getDescription(),
            signalement.getLatitude(),
            signalement.getLongitude(),
            signalement.getSurfaceM2(),
            signalement.getNiveau(),
            signalement.getBudget(),
            signalement.getStatut().name(),
            signalement.getUtilisateur() != null ? signalement.getUtilisateur().getEmail() : null,
            signalement.getDateSignalement(),
            signalement.getEntreprise() != null ? signalement.getEntreprise().getNom() : null,
            signalement.getDateEnCours(),
            signalement.getDateTermine(),
            imageUrls
        );
    }
}
