package com.cloud.web.user.dto;

import com.cloud.web.user.UserRole;

public class UserResponse {

    private String email;
    private String nom;
    private String prenom;
    private UserRole role;

    public UserResponse() {
    }

    public UserResponse(String email, String nom, String prenom, UserRole role) {
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
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
}
