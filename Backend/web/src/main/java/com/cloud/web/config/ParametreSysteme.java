package com.cloud.web.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "parametre_systeme")
public class ParametreSysteme {

    @Id
    @Column(name = "cle", length = 80)
    private String cle;

    @Column(name = "valeur", nullable = false, length = 50)
    private String valeur;

    public String getCle() {
        return cle;
    }

    public void setCle(String cle) {
        this.cle = cle;
    }

    public String getValeur() {
        return valeur;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur;
    }
}
