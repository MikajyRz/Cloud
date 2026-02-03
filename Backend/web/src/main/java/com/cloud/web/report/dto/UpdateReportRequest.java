package com.cloud.web.report.dto;

import com.cloud.web.report.StatutTravaux;

public class UpdateReportRequest {

    private Double surfaceM2;
    private Double budget;
    private String idEntreprise;
    private StatutTravaux statut;

    public UpdateReportRequest() {
    }

    public Double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(Double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public String getIdEntreprise() {
        return idEntreprise;
    }

    public void setIdEntreprise(String idEntreprise) {
        this.idEntreprise = idEntreprise;
    }

    public StatutTravaux getStatut() {
        return statut;
    }

    public void setStatut(StatutTravaux statut) {
        this.statut = statut;
    }
}
