package com.cloud.web.user;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FirebaseUserSyncService {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final UserRepository userRepository;
    private final FirebaseAuth firebaseAuth;

    public FirebaseUserSyncService(UserRepository userRepository, FirebaseAuth firebaseAuth) {
        this.userRepository = userRepository;
        this.firebaseAuth = firebaseAuth;
    }

    @Transactional
    public void syncAllUsersToPostgres() {
        ListUsersPage page;
        try {
            page = firebaseAuth.listUsers(null);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot list Firebase users", ex);
        }

        for (UserRecord record : page.iterateAll()) {
            String email = record.getEmail();
            if (email == null || email.isBlank()) {
                continue;
            }

            String normalized = email.toLowerCase();
            if (userRepository.existsByEmail(normalized)) {
                continue;
            }

            User u = new User();
            u.setEmail(normalized);
            u.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
            u.setNom(record.getDisplayName());
            u.setPrenom(null);
            u.setRole(UserRole.UTILISATEUR);
            u.setTentativesEchouees(0);
            u.setEstBloque(false);
            userRepository.save(u);
        }
    }
}
