package com.cloud.web.signalement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, UUID> {
    List<Signalement> findByUtilisateurEmail(String email);
    List<Signalement> findByStatut(StatutTravaux statut);
    Optional<Signalement> findByFirestoreId(String firestoreId);
}
