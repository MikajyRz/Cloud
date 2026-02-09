package com.cloud.web.entreprise;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EntrepriseRepository extends JpaRepository<Entreprise, UUID> {
    Optional<Entreprise> findByNom(String nom);
}
