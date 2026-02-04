package com.cloud.web.auth;

import com.cloud.web.utilisateur.Utilisateur;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_utilisateur")
public class AuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String token;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDateTime getDateExpiration() {
        return dateExpiration;
    }

    public void setDateExpiration(LocalDateTime dateExpiration) {
        this.dateExpiration = dateExpiration;
    }

    // Backward compatibility methods
    public String getUserEmail() {
        return utilisateur != null ? utilisateur.getEmail() : null;
    }

    public void setUserEmail(String userEmail) {
        // Not directly settable, must set utilisateur
    }

    public java.time.Instant getExpiresAt() {
        return dateExpiration != null ? 
            dateExpiration.atZone(java.time.ZoneId.systemDefault()).toInstant() : null;
    }

    public void setExpiresAt(java.time.Instant expiresAt) {
        this.dateExpiration = expiresAt != null ? 
            LocalDateTime.ofInstant(expiresAt, java.time.ZoneId.systemDefault()) : null;
    }

    public String getJti() {
        return token;  // Use token as JTI for backward compatibility
    }

    public void setJti(String jti) {
        // Ignored for backward compatibility
    }

    public boolean isRevoked() {
        return false;  // Not using revoked anymore
    }

    public void setRevoked(boolean revoked) {
        // Ignored for backward compatibility
    }
}
