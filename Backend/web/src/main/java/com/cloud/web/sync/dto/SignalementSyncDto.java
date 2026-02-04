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
    private Double latitude;
    private Double longitude;
    private Double surfaceM2;
    private Double budget;
    private String statut;
    private String emailUtilisateur;
    
    // Champs du mobile (non utilisés pour PostgreSQL mais présents dans Firestore)
    private String deviceId;
    private String userEmail;
    private String userName;
    private String nomEntreprise;
    private Object createdAt;
    private Object dateSignalement;

    public SignalementSyncDto() {}

    public SignalementSyncDto(Signalement sig) {
        this.id = sig.getId().toString();
        this.titre = sig.getTitre();
        this.description = sig.getDescription();
        this.latitude = sig.getLatitude().doubleValue();
        this.longitude = sig.getLongitude().doubleValue();
        this.surfaceM2 = sig.getSurfaceM2() != null ? sig.getSurfaceM2().doubleValue() : null;
        this.budget = sig.getBudget() != null ? sig.getBudget().doubleValue() : null;
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
        sig.setLatitude(BigDecimal.valueOf(latitude));
        sig.setLongitude(BigDecimal.valueOf(longitude));
        if (surfaceM2 != null) sig.setSurfaceM2(BigDecimal.valueOf(surfaceM2));
        if (budget != null) sig.setBudget(BigDecimal.valueOf(budget));
        sig.setStatut(StatutTravaux.valueOf(statut));
        
        // Essayer userEmail du mobile d'abord, puis emailUtilisateur
        String email = userEmail != null ? userEmail : emailUtilisateur;
        if (email != null && !email.isEmpty()) {
            Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);
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
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getSurfaceM2() { return surfaceM2; }
    public void setSurfaceM2(Double surfaceM2) { this.surfaceM2 = surfaceM2; }
    public Double getBudget() { return budget; }
    public void setBudget(Double budget) { this.budget = budget; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getEmailUtilisateur() { return emailUtilisateur; }
    public void setEmailUtilisateur(String emailUtilisateur) { this.emailUtilisateur = emailUtilisateur; }
    
    // Getters/setters pour champs mobile (ignorés)
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }
    public Object getCreatedAt() { return createdAt; }
    public void setCreatedAt(Object createdAt) { this.createdAt = createdAt; }
    public Object getDateSignalement() { return dateSignalement; }
    public void setDateSignalement(Object dateSignalement) { this.dateSignalement = dateSignalement; }
}
