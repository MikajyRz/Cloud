package com.cloud.web.sync.dto;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.StatutTravaux;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;

import java.math.BigDecimal;
import java.util.List;
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
    
    // Champs pour les images
    private List<String> imageUrls;
    
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
        // Convertir le JSON stocké en List<String>
        if (sig.getImageUrls() != null && !sig.getImageUrls().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.imageUrls = mapper.readValue(sig.getImageUrls(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            } catch (Exception e) {
                this.imageUrls = null;
            }
        }
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
        
        // Convertir List<String> en JSON pour stockage
        if (imageUrls != null && !imageUrls.isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                sig.setImageUrls(mapper.writeValueAsString(imageUrls));
            } catch (Exception e) {
                sig.setImageUrls(null);
            }
        }
        
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
    
    // Support pour le champ "status" envoyé par le mobile (alias de statut)
    public String getStatus() { return statut; }
    public void setStatus(String status) { this.statut = status; }
    
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
    
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}
