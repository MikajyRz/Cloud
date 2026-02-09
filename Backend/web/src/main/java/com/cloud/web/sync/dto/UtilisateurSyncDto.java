package com.cloud.web.sync.dto;

import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.RoleUtilisateur;

public class UtilisateurSyncDto {
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private String motDePasse;
    private String telephone;
    private int tentativesEchouees;
    private boolean estBloque;

    public UtilisateurSyncDto() {}

    public UtilisateurSyncDto(Utilisateur u) {
        this.email = u.getEmail();
        this.nom = u.getNom();
        this.prenom = u.getPrenom();
        this.role = u.getRole().name();
        this.motDePasse = u.getMotDePasse();
        this.telephone = u.getTelephone();
        this.tentativesEchouees = u.getTentativesEchouees();
        this.estBloque = Boolean.TRUE.equals(u.getEstBloque());
    }

    public Utilisateur toEntity() {
        Utilisateur u = new Utilisateur();
        u.setEmail(email);
        u.setNom(nom);
        u.setPrenom(prenom);
        u.setRole(mapRole(role));
        u.setMotDePasse(motDePasse != null ? motDePasse : "");
        u.setTelephone(telephone);
        u.setTentativesEchouees(tentativesEchouees);
        u.setEstBloque(estBloque);
        return u;
    }
    
    // Mapper les rôles du mobile vers les rôles PostgreSQL
    private RoleUtilisateur mapRole(String roleStr) {
        if (roleStr == null || roleStr.isEmpty()) {
            return RoleUtilisateur.UTILISATEUR;
        }
        switch (roleStr.toLowerCase()) {
            case "user":
            case "utilisateur":
                return RoleUtilisateur.UTILISATEUR;
            case "manager":
                return RoleUtilisateur.MANAGER;
            case "visiteur":
            case "visitor":
                return RoleUtilisateur.VISITEUR;
            default:
                return RoleUtilisateur.UTILISATEUR;
        }
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public int getTentativesEchouees() { return tentativesEchouees; }
    public void setTentativesEchouees(int tentativesEchouees) { this.tentativesEchouees = tentativesEchouees; }
    public boolean isEstBloque() { return estBloque; }
    public void setEstBloque(boolean estBloque) { this.estBloque = estBloque; }
}
