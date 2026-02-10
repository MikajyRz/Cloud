package com.cloud.web.manager;

import jakarta.persistence.*;

@Entity
@Table(name = "niveau_reparation")
public class NiveauReparation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int valeur; // 1 à 10

    @Column(length = 50)
    private String libelle;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getValeur() { return valeur; }
    public void setValeur(int valeur) { this.valeur = valeur; }

    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
}
