package com.cloud.web.sync.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO pour retourner le résultat d'une synchronisation bidirectionnelle
 */
public class SyncResultDto {
    private boolean success;
    private String message;
    private SyncStats utilisateurs;
    private SyncStats signalements;
    private List<String> logs;
    private List<String> errors;

    public SyncResultDto() {
        this.utilisateurs = new SyncStats();
        this.signalements = new SyncStats();
        this.logs = new ArrayList<>();
        this.errors = new ArrayList<>();
    }

    public static class SyncStats {
        private int nouveauxDepuisFirestore;
        private int misAJourVersFirestore;
        private int total;

        public SyncStats() {
            this.nouveauxDepuisFirestore = 0;
            this.misAJourVersFirestore = 0;
            this.total = 0;
        }

        public void incrementNouveaux() {
            this.nouveauxDepuisFirestore++;
            this.total++;
        }

        public void incrementMisAJour() {
            this.misAJourVersFirestore++;
            this.total++;
        }

        // Getters and Setters
        public int getNouveauxDepuisFirestore() { return nouveauxDepuisFirestore; }
        public void setNouveauxDepuisFirestore(int nouveauxDepuisFirestore) { this.nouveauxDepuisFirestore = nouveauxDepuisFirestore; }
        public int getMisAJourVersFirestore() { return misAJourVersFirestore; }
        public void setMisAJourVersFirestore(int misAJourVersFirestore) { this.misAJourVersFirestore = misAJourVersFirestore; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
    }

    public void addLog(String log) {
        this.logs.add(log);
    }

    public void addError(String error) {
        this.errors.add(error);
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public SyncStats getUtilisateurs() { return utilisateurs; }
    public void setUtilisateurs(SyncStats utilisateurs) { this.utilisateurs = utilisateurs; }
    public SyncStats getSignalements() { return signalements; }
    public void setSignalements(SyncStats signalements) { this.signalements = signalements; }
    public List<String> getLogs() { return logs; }
    public void setLogs(List<String> logs) { this.logs = logs; }
    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
