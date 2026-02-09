package com.cloud.web.sync;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.SignalementRepository;
import com.cloud.web.signalement.StatutTravaux;
import com.cloud.web.sync.dto.SignalementSyncDto;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class SyncPersistenceService {

    private static BigDecimal toBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        if (val instanceof String) {
            try { return new BigDecimal((String) val); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private final SignalementRepository signalementRepository;
    private final FirebaseSyncRepository syncRepository;
    private final JdbcTemplate jdbcTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public SyncPersistenceService(SignalementRepository signalementRepository, 
                                   FirebaseSyncRepository syncRepository,
                                   JdbcTemplate jdbcTemplate) {
        this.signalementRepository = signalementRepository;
        this.syncRepository = syncRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean saveSignalement(UUID sigId, SignalementSyncDto dto, UtilisateurRepository utilisateurRepository) {
        try {
            // Vérifier si le signalement existe déjà
            Optional<Signalement> existing = signalementRepository.findById(sigId);
            
            // Récupérer l'utilisateur dans le contexte de la transaction
            String email = dto.getUserEmail() != null ? dto.getUserEmail() : dto.getEmailUtilisateur();
            UUID utilisateurId = null;
            if (email != null && !email.isEmpty()) {
                Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);
                if (utilisateur != null) {
                    utilisateurId = utilisateur.getId();
                }
            }
            
            if (existing.isPresent()) {
                // Mettre à jour le signalement existant
                Signalement sig = existing.get();
                sig.setTitre(dto.getTitre());
                sig.setDescription(dto.getDescription());
                sig.setLatitude(toBigDecimal(dto.getLatitude()));
                sig.setLongitude(toBigDecimal(dto.getLongitude()));
                sig.setSurfaceM2(toBigDecimal(dto.getSurfaceM2()));
                sig.setBudget(toBigDecimal(dto.getBudget()));
                if (dto.getStatut() != null) sig.setStatut(StatutTravaux.valueOf(dto.getStatut()));
                if (utilisateurId != null) {
                    Utilisateur u = entityManager.find(Utilisateur.class, utilisateurId);
                    sig.setUtilisateur(u);
                }
                
                signalementRepository.saveAndFlush(sig);
            } else {
                // Insérer via SQL natif pour éviter les problèmes de détachement
                String sql = "INSERT INTO signalement (id, titre, description, latitude, longitude, surface_m2, budget, statut, date_signalement, id_utilisateur) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?::statuttravaux, ?, ?)";
                
                jdbcTemplate.update(sql,
                    sigId,
                    dto.getTitre(),
                    dto.getDescription(),
                    toBigDecimal(dto.getLatitude()),
                    toBigDecimal(dto.getLongitude()),
                    toBigDecimal(dto.getSurfaceM2()),
                    toBigDecimal(dto.getBudget()),
                    dto.getStatut(),
                    Timestamp.valueOf(LocalDateTime.now()),
                    utilisateurId
                );
            }

            FirebaseSync sync = new FirebaseSync();
            sync.setTypeDonnee("SIGNALEMENT");
            sync.setIdReference(sigId);
            sync.setSens(SyncType.PULL);
            sync.setDateSync(LocalDateTime.now());
            syncRepository.save(sync);
            
            return true;
        } catch (Exception e) {
            System.err.println("⚠️ Erreur dans saveSignalement: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Signalement insertSignalement(Signalement signalement) {
        // Insérer via SQL natif
        String sql = "INSERT INTO signalement (id, titre, description, latitude, longitude, surface_m2, budget, statut, date_signalement, id_utilisateur, id_entreprise) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?::statuttravaux, ?, ?, ?)";
        
        jdbcTemplate.update(sql,
            signalement.getId(),
            signalement.getTitre(),
            signalement.getDescription(),
            signalement.getLatitude(),
            signalement.getLongitude(),
            signalement.getSurfaceM2(),
            signalement.getBudget(),
            signalement.getStatut().name(),
            Timestamp.valueOf(signalement.getDateSignalement() != null ? signalement.getDateSignalement() : LocalDateTime.now()),
            signalement.getUtilisateur() != null ? signalement.getUtilisateur().getId() : null,
            signalement.getEntreprise() != null ? signalement.getEntreprise().getId() : null
        );
        
        return signalement;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Signalement updateSignalement(Signalement signalement) {
        return signalementRepository.saveAndFlush(signalement);
    }
}