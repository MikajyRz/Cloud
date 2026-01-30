package com.cloud.web.sync;

import com.cloud.web.sync.dto.SyncResultDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final FirebaseSyncService syncService;

    public SyncController(FirebaseSyncService syncService) {
        this.syncService = syncService;
    }

    /**
     * PUSH: Envoyer les utilisateurs vers Firestore
     */
    @PostMapping("/utilisateurs/push")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> pushUsersToFirebase() {
        try {
            int count = syncService.pushUsersToFirebase();
            return Map.of(
                    "success", true,
                    "count", count,
                    "message", count + " utilisateur(s) envoyé(s) vers Firestore"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * SEED: Initialiser Firestore avec le JSON local
     */
    @PostMapping("/seed")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> seedFirebase() {
        try {
            syncService.seedFirebaseFromLocalJson();
            return Map.of(
                    "success", true,
                    "message", "Firestore initialisé avec succès à partir de firebase-import.json"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Erreur lors de l'initialisation: " + e.getMessage()
            );
        }
    }

    /**
     * PULL: Récupérer les utilisateurs depuis Firestore
     */
    @PostMapping("/utilisateurs/pull")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> pullUsersFromFirebase() {
        try {
            int count = syncService.pullUsersFromFirebase();
            return Map.of(
                    "success", true,
                    "count", count,
                    "message", count + " utilisateur(s) importé(s) depuis Firestore"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * PUSH: Envoyer les signalements vers Firestore
     */
    @PostMapping("/signalements/push")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> pushSignalementsToFirebase() {
        try {
            int count = syncService.pushSignalementsToFirebase();
            return Map.of(
                    "success", true,
                    "count", count,
                    "message", count + " signalement(s) envoyé(s) vers Firestore"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * PULL: Récupérer les signalements depuis Firestore
     */
    @PostMapping("/signalements/pull")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> pullSignalementsFromFirebase() {
        try {
            int count = syncService.pullSignalementsFromFirebase();
            return Map.of(
                    "success", true,
                    "count", count,
                    "message", count + " signalement(s) importé(s) depuis Firestore"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * Récupérer l'historique de synchronisation
     */
    @GetMapping("/history/{type}")
    @PreAuthorize("hasRole('MANAGER')")
    public List<FirebaseSync> getSyncHistory(@PathVariable String type) {
        return syncService.getSyncHistory(type.toUpperCase());
    }

    /**
     * SYNCHRONISATION BIDIRECTIONNELLE COMPLÈTE
     * 
     * Ce endpoint déclenche la synchronisation bidirectionnelle entre Firestore et PostgreSQL
     * avec les règles suivantes :
     * 1. Nouvelles données dans Firestore → INSERT dans PostgreSQL
     * 2. Données existantes avec différences → PostgreSQL prioritaire → UPDATE Firestore
     * 3. Données uniquement dans PostgreSQL → PUSH vers Firestore
     */
    @PostMapping("/synchronize")
    @PreAuthorize("hasRole('MANAGER')")
    public SyncResultDto synchronizeBidirectional() {
        try {
            return syncService.synchronizeBidirectional();
        } catch (Exception e) {
            SyncResultDto errorResult = new SyncResultDto();
            errorResult.setSuccess(false);
            errorResult.setMessage("Erreur lors de la synchronisation : " + e.getMessage());
            errorResult.addError("Exception : " + e.getMessage());
            return errorResult;
        }
    }
}
