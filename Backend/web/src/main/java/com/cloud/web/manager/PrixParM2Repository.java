package com.cloud.web.manager;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PrixParM2Repository extends JpaRepository<PrixParM2, Long> {
    Optional<PrixParM2> findTopByOrderByDateModifDesc();
}
