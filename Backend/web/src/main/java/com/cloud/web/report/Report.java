package com.cloud.web.report;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "signalement")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @Column(name = "firestore_id", unique = true, length = 128)
    private String firestoreId;

    @Column(name = "titre", length = 150)
    private String titre;

    @Column(name = "description")
    private String description;

    @Column(name = "latitude", nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false)
    private BigDecimal longitude;

    @Column(name = "surface_m2")
    private BigDecimal surfaceM2;

    @Column(name = "budget")
    private BigDecimal budget;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "statut", columnDefinition = "statut_travaux")
    private StatutTravaux statut;

    @Column(name = "date_signalement")
    private Instant dateSignalement;

    @Column(name = "id_utilisateur")
    private UUID idUtilisateur;

    @Column(name = "id_entreprise")
    private UUID idEntreprise;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
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

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(BigDecimal surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public StatutTravaux getStatut() {
        return statut;
    }

    public void setStatut(StatutTravaux statut) {
        this.statut = statut;
    }

    public Instant getDateSignalement() {
        return dateSignalement;
    }

    public void setDateSignalement(Instant dateSignalement) {
        this.dateSignalement = dateSignalement;
    }

    public UUID getIdUtilisateur() {
        return idUtilisateur;
    }

    public void setIdUtilisateur(UUID idUtilisateur) {
        this.idUtilisateur = idUtilisateur;
    }

    public UUID getIdEntreprise() {
        return idEntreprise;
    }

    public void setIdEntreprise(UUID idEntreprise) {
        this.idEntreprise = idEntreprise;
    }
}
