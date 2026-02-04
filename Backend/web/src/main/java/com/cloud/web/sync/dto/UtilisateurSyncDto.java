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

    public UtilisateurSyncDto() {}

    public UtilisateurSyncDto(Utilisateur u) {
        this.email = u.getEmail();
        this.nom = u.getNom();
        this.prenom = u.getPrenom();
        this.role = u.getRole().name();
        this.motDePasse = u.getMotDePasse();
        this.telephone = u.getTelephone();
    }

    public Utilisateur toEntity() {
        Utilisateur u = new Utilisateur();
        u.setEmail(email);
        u.setNom(nom);
        u.setPrenom(prenom);
        u.setRole(RoleUtilisateur.valueOf(role));
        u.setMotDePasse(motDePasse != null ? motDePasse : "");
        u.setTelephone(telephone);
        return u;
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
}
