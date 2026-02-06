package com.cloud.web.user;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FirestoreUserSyncService {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final Firestore firestore;
    private final UserRepository userRepository;
    private final String firestoreUsersCollection;

    public FirestoreUserSyncService(
            Firestore firestore,
            UserRepository userRepository,
            @Value("${firestore.users.collection:users}") String firestoreUsersCollection
    ) {
        this.firestore = firestore;
        this.userRepository = userRepository;
        this.firestoreUsersCollection = firestoreUsersCollection;
    }

    @Transactional
    public int syncAllUsersToPostgres() {
        QuerySnapshot snap;
        try {
            snap = firestore.collection(firestoreUsersCollection).get().get();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot fetch Firestore users collection: " + firestoreUsersCollection, ex);
        }

        int upserted = 0;

        for (DocumentSnapshot doc : snap.getDocuments()) {
            String email = doc.getString("email");
            if (email == null || email.isBlank()) {
                continue;
            }

            String normalized = email.toLowerCase();

            User user = userRepository.findByEmail(normalized).orElseGet(() -> {
                User created = new User();
                created.setEmail(normalized);
                created.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
                created.setRole(UserRole.UTILISATEUR);
                created.setTentativesEchouees(0);
                created.setEstBloque(false);
                return created;
            });

            // Best-effort mapping (do not overwrite with blanks)
            String nom = doc.getString("nom");
            String prenom = doc.getString("prenom");
            String fullName = doc.getString("fullName");

            if (nom != null && !nom.isBlank()) {
                user.setNom(nom);
            } else if ((user.getNom() == null || user.getNom().isBlank()) && fullName != null && !fullName.isBlank()) {
                user.setNom(fullName);
            }

            if (prenom != null && !prenom.isBlank()) {
                user.setPrenom(prenom);
            }

            String roleStr = doc.getString("role");
            if (roleStr != null && !roleStr.isBlank()) {
                try {
                    user.setRole(UserRole.valueOf(roleStr));
                } catch (Exception ignored) {
                    // ignore unknown role
                }
            }

            userRepository.save(user);
            upserted++;
        }

        return upserted;
    }
}
