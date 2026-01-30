package com.cloud.web.utilisateur.dto;

public record UtilisateurListDto(
    String email,
    String nom,
    String prenom,
    String role,
    boolean estBloque,
    int tentativesEchouees
) {}
