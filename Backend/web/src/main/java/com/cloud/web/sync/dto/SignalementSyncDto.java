package com.cloud.web.sync.dto;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.StatutTravaux;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;

import java.math.BigDecimal;
import java.util.UUID;

public class SignalementSyncDto {
    private String id;
    private String titre;
    private String description;
    private String latitude;
    private String longitude;
    private String surfaceM2;
    private String budget;
    private String statut;
    private String emailUtilisateur;

    public SignalementSyncDto() {}

    public SignalementSyncDto(Signalement sig) {
        this.id = sig.getId().toString();
        this.titre = sig.getTitre();
        this.description = sig.getDescription();
        this.latitude = sig.getLatitude().toString();
        this.longitude = sig.getLongitude().toString();
        this.surfaceM2 = sig.getSurfaceM2() != null ? sig.getSurfaceM2().toString() : null;
        this.budget = sig.getBudget() != null ? sig.getBudget().toString() : null;
        this.statut = sig.getStatut().name();
        this.emailUtilisateur = sig.getUtilisateur() != null ? sig.getUtilisateur().getEmail() : null;
    }

    public Signalement toEntity(UtilisateurRepository utilisateurRepository) {
        Signalement sig = new Signalement();
        if (id != null && !id.isEmpty()) {
            sig.setId(UUID.fromString(id));
        }
        sig.setTitre(titre);
        sig.setDescription(description);
        sig.setLatitude(new BigDecimal(latitude));
        sig.setLongitude(new BigDecimal(longitude));
        if (surfaceM2 != null) sig.setSurfaceM2(new BigDecimal(surfaceM2));
        if (budget != null) sig.setBudget(new BigDecimal(budget));
        sig.setStatut(StatutTravaux.valueOf(statut));
        
        if (emailUtilisateur != null) {
            Utilisateur utilisateur = utilisateurRepository.findByEmail(emailUtilisateur).orElse(null);
            sig.setUtilisateur(utilisateur);
        }
        return sig;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }
    public String getSurfaceM2() { return surfaceM2; }
    public void setSurfaceM2(String surfaceM2) { this.surfaceM2 = surfaceM2; }
    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getEmailUtilisateur() { return emailUtilisateur; }
    public void setEmailUtilisateur(String emailUtilisateur) { this.emailUtilisateur = emailUtilisateur; }
}
