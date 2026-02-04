package com.cloud.web.sync;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur temporaire pour tester la synchronisation sans authentification
 * À SUPPRIMER EN PRODUCTION
 */
@RestController
@RequestMapping("/api/test-sync")
public class TestSyncController {

    private final FirebaseSyncService syncService;

    public TestSyncController(FirebaseSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/push-all")
    public Map<String, Object> pushAllToFirestore() {
        try {
            int userCount = syncService.pushUsersToFirebase();
            int sigCount = syncService.pushSignalementsToFirebase();
            
            return Map.of(
                    "success", true,
                    "utilisateurs", userCount,
                    "signalements", sigCount,
                    "message", userCount + " utilisateur(s) et " + sigCount + " signalement(s) pushés vers Firestore"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    @PostMapping("/seed")
    public Map<String, Object> seedFirestore() {
        try {
            syncService.seedFirebaseFromLocalJson();
            return Map.of(
                    "success", true,
                    "message", "Données importées depuis firebase-import.json"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }
}
