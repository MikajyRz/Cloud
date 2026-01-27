package com.cloud.web.sync;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FirebaseSyncRepository extends JpaRepository<FirebaseSync, UUID> {
    List<FirebaseSync> findByTypeDonneeAndSens(String typeDonnee, SyncType sens);
}
