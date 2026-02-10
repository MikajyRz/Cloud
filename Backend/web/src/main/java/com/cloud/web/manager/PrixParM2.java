package com.cloud.web.manager;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prix_par_m2")
public class PrixParM2 {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valeur;

    @Column(name = "date_modif")
    private LocalDateTime dateModif = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getValeur() { return valeur; }
    public void setValeur(BigDecimal valeur) { this.valeur = valeur; }

    public LocalDateTime getDateModif() { return dateModif; }
    public void setDateModif(LocalDateTime dateModif) { this.dateModif = dateModif; }
}
