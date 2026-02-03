package com.cloud.web.user.dto;

import com.cloud.web.user.UserRole;

public class LockedUserResponse {

    private String email;
    private String nom;
    private String prenom;
    private UserRole role;
    private int tentativesEchouees;

    public LockedUserResponse() {
    }

    public LockedUserResponse(String email, String nom, String prenom, UserRole role, int tentativesEchouees) {
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.tentativesEchouees = tentativesEchouees;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public int getTentativesEchouees() {
        return tentativesEchouees;
    }

    public void setTentativesEchouees(int tentativesEchouees) {
        this.tentativesEchouees = tentativesEchouees;
    }
}
