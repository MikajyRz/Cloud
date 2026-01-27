package com.cloud.web.sync;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "firebase_sync")
public class FirebaseSync {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "type_donnee", length = 50)
    private String typeDonnee; // UTILISATEUR, SIGNALEMENT

    @Column(name = "id_reference")
    private UUID idReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "sens")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private SyncType sens;

    @Column(name = "date_sync")
    private LocalDateTime dateSync = LocalDateTime.now();

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTypeDonnee() {
        return typeDonnee;
    }

    public void setTypeDonnee(String typeDonnee) {
        this.typeDonnee = typeDonnee;
    }

    public UUID getIdReference() {
        return idReference;
    }

    public void setIdReference(UUID idReference) {
        this.idReference = idReference;
    }

    public SyncType getSens() {
        return sens;
    }

    public void setSens(SyncType sens) {
        this.sens = sens;
    }

    public LocalDateTime getDateSync() {
        return dateSync;
    }

    public void setDateSync(LocalDateTime dateSync) {
        this.dateSync = dateSync;
    }
}
