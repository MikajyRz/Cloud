package com.cloud.web.report.dto;

import com.cloud.web.report.StatutTravaux;

public class ManagerReportResponse {

    private String id;
    private String firestoreId;
    private String titre;
    private String description;
    private Double latitude;
    private Double longitude;
    private Double surfaceM2;
    private Double budget;
    private StatutTravaux statut;
    private String dateSignalement;
    private String idUtilisateur;
    private String idEntreprise;

    public ManagerReportResponse() {
    }

    public ManagerReportResponse(
            String id,
            String firestoreId,
            String titre,
            String description,
            Double latitude,
            Double longitude,
            Double surfaceM2,
            Double budget,
            StatutTravaux statut,
            String dateSignalement,
            String idUtilisateur,
            String idEntreprise
    ) {
        this.id = id;
        this.firestoreId = firestoreId;
        this.titre = titre;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.surfaceM2 = surfaceM2;
        this.budget = budget;
        this.statut = statut;
        this.dateSignalement = dateSignalement;
        this.idUtilisateur = idUtilisateur;
        this.idEntreprise = idEntreprise;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirestoreId() {
        return firestoreId;
    }

    public void setFirestoreId(String firestoreId) {
        this.firestoreId = firestoreId;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(Double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public StatutTravaux getStatut() {
        return statut;
    }

    public void setStatut(StatutTravaux statut) {
        this.statut = statut;
    }

    public String getDateSignalement() {
        return dateSignalement;
    }

    public void setDateSignalement(String dateSignalement) {
        this.dateSignalement = dateSignalement;
    }

    public String getIdUtilisateur() {
        return idUtilisateur;
    }

    public void setIdUtilisateur(String idUtilisateur) {
        this.idUtilisateur = idUtilisateur;
    }

    public String getIdEntreprise() {
        return idEntreprise;
    }

    public void setIdEntreprise(String idEntreprise) {
        this.idEntreprise = idEntreprise;
    }
}
