package com.cloud.web.user;

import com.cloud.web.utilisateur.RoleUtilisateur;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
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
    private final UtilisateurRepository utilisateurRepository;
    private final String firestoreUsersCollection;

    public FirestoreUserSyncService(
            Firestore firestore,
            UtilisateurRepository utilisateurRepository,
            @Value("${firestore.users.collection:users}") String firestoreUsersCollection
    ) {
        this.firestore = firestore;
        this.utilisateurRepository = utilisateurRepository;
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

            Utilisateur user = utilisateurRepository.findByEmail(normalized).orElseGet(() -> {
                Utilisateur created = new Utilisateur();
                created.setEmail(normalized);
                created.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
                created.setRole(RoleUtilisateur.UTILISATEUR);
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
                    user.setRole(RoleUtilisateur.valueOf(roleStr));
                } catch (Exception ignored) {
                    // ignore unknown role
                }
            }

            utilisateurRepository.save(user);
            upserted++;
        }

        return upserted;
    }
}
