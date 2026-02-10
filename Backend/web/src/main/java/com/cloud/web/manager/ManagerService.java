package com.cloud.web.manager;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Optional;

@Service
public class ManagerService {
    @Autowired
    private PrixParM2Repository prixParM2Repository;
    @Autowired
    private NiveauReparationRepository niveauReparationRepository;
    @Autowired
    private SignalementRepository signalementRepository;

    // Calcul automatique du budget
    public BigDecimal calculerBudget(Long niveauId, BigDecimal surfaceM2) {
        Optional<PrixParM2> prixOpt = prixParM2Repository.findTopByOrderByDateModifDesc();
        Optional<NiveauReparation> niveauOpt = niveauReparationRepository.findById(niveauId);
        if (prixOpt.isPresent() && niveauOpt.isPresent() && surfaceM2 != null) {
            BigDecimal prix = prixOpt.get().getValeur();
            int niveau = niveauOpt.get().getValeur();
            return prix.multiply(BigDecimal.valueOf(niveau)).multiply(surfaceM2);
        }
        return BigDecimal.ZERO;
    }
}
