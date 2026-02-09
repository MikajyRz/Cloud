package com.cloud.web.user;

import com.cloud.web.utilisateur.RoleUtilisateur;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnBean(FirebaseAuth.class)
public class FirebaseUserSyncService {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final UtilisateurRepository utilisateurRepository;
    private final FirebaseAuth firebaseAuth;

    public FirebaseUserSyncService(UtilisateurRepository utilisateurRepository, FirebaseAuth firebaseAuth) {
        this.utilisateurRepository = utilisateurRepository;
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
            if (utilisateurRepository.existsByEmail(normalized)) {
                continue;
            }

            Utilisateur u = new Utilisateur();
            u.setEmail(normalized);
            u.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
            u.setNom(record.getDisplayName());
            u.setPrenom(null);
            u.setRole(RoleUtilisateur.UTILISATEUR);
            u.setTentativesEchouees(0);
            u.setEstBloque(false);
            utilisateurRepository.save(u);
        }
    }
}
