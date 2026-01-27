package com.cloud.web.sync;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.SignalementRepository;
import com.cloud.web.sync.dto.SignalementSyncDto;
import com.cloud.web.sync.dto.UtilisateurSyncDto;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseSyncService {

    private final FirebaseSyncRepository syncRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SignalementRepository signalementRepository;
    private Firestore firestore;

    public FirebaseSyncService(
            FirebaseSyncRepository syncRepository,
            UtilisateurRepository utilisateurRepository,
            SignalementRepository signalementRepository) {
        this.syncRepository = syncRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.signalementRepository = signalementRepository;
        // Firestore sera initialisé au premier appel
    }
    
    private Firestore getFirestore() {
        if (firestore == null && isFirebaseAvailable()) {
            firestore = FirestoreClient.getFirestore();
        }
        return firestore;
    }

    private boolean isFirebaseAvailable() {
        return FirebaseApp.getApps() != null && !FirebaseApp.getApps().isEmpty();
    }

    /**
     * PUSH: Envoyer des utilisateurs de PostgreSQL vers Firestore
     */
    @Transactional
    public int pushUsersToFirebase() throws ExecutionException, InterruptedException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
        }
        
        List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
        CollectionReference usersRef = getFirestore().collection("utilisateurs");

        int count = 0;
        for (Utilisateur utilisateur : utilisateurs) {
            UtilisateurSyncDto dto = new UtilisateurSyncDto(utilisateur);
            Map<String, Object> userData = convertToMap(dto);
            
            // Utiliser l'email comme ID du document (en remplaçant les points)
            String docId = utilisateur.getEmail().replace(".", "_");
            usersRef.document(docId).set(userData).get();

            // Enregistrer la synchronisation
            FirebaseSync sync = new FirebaseSync();
            sync.setTypeDonnee("UTILISATEUR");
            sync.setIdReference(UUID.nameUUIDFromBytes(utilisateur.getEmail().getBytes()));
            sync.setSens(SyncType.PUSH);
            sync.setDateSync(LocalDateTime.now());
            syncRepository.save(sync);
            count++;
        }
        return count;
    }

    /**
     * PULL: Récupérer des utilisateurs depuis Firestore vers PostgreSQL
     */
    @Transactional
    public int pullUsersFromFirebase() throws InterruptedException, ExecutionException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
        }
        
        CollectionReference usersRef = getFirestore().collection("utilisateurs");
        ApiFuture<QuerySnapshot> future = usersRef.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        System.out.println("DEBUG: Trouvé " + documents.size() + " utilisateur(s) dans Firestore");

        int count = 0;
        for (QueryDocumentSnapshot document : documents) {
            try {
                System.out.println("DEBUG: Lecture du document: " + document.getId());
                Map<String, Object> data = document.getData();
                
                UtilisateurSyncDto dto = new UtilisateurSyncDto();
                dto.setNom((String) data.get("nom"));
                dto.setPrenom((String) data.get("prenom"));
                dto.setEmail((String) data.get("email"));
                dto.setMotDePasse((String) data.get("motDePasse"));
                dto.setRole((String) data.get("role"));
                dto.setTelephone((String) data.get("telephone"));
                
                // Vérifier si l'utilisateur existe déjà
                Optional<Utilisateur> existing = utilisateurRepository.findByEmail(dto.getEmail());
                if (existing.isEmpty()) {
                    Utilisateur utilisateur = dto.toEntity();
                    utilisateurRepository.save(utilisateur);

                    FirebaseSync sync = new FirebaseSync();
                    sync.setTypeDonnee("UTILISATEUR");
                    sync.setIdReference(UUID.nameUUIDFromBytes(utilisateur.getEmail().getBytes()));
                    sync.setSens(SyncType.PULL);
                    sync.setDateSync(LocalDateTime.now());
                    syncRepository.save(sync);
                    count++;
                } else {
                    System.out.println("DEBUG: Utilisateur " + dto.getEmail() + " existe déjà");
                }
            } catch (Exception e) {
                System.err.println("Erreur lors de la lecture du document " + document.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        return count;
    }

    /**
     * PUSH: Envoyer des signalements de PostgreSQL vers Firestore
     */
    @Transactional
    public int pushSignalementsToFirebase() throws ExecutionException, InterruptedException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
        }
        
        List<Signalement> signalements = signalementRepository.findAll();
        CollectionReference sigRef = getFirestore().collection("signalements");

        int count = 0;
        for (Signalement sig : signalements) {
            SignalementSyncDto dto = new SignalementSyncDto(sig);
            Map<String, Object> sigData = convertToMap(dto);
            
            sigRef.document(sig.getId().toString()).set(sigData).get();

            FirebaseSync sync = new FirebaseSync();
            sync.setTypeDonnee("SIGNALEMENT");
            sync.setIdReference(sig.getId());
            sync.setSens(SyncType.PUSH);
            sync.setDateSync(LocalDateTime.now());
            syncRepository.save(sync);
            count++;
        }
        return count;
    }

    /**
     * PULL: Récupérer des signalements depuis Firestore vers PostgreSQL
     */
    @Transactional
    public int pullSignalementsFromFirebase() throws InterruptedException, ExecutionException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
        }
        
        CollectionReference sigRef = getFirestore().collection("signalements");
        ApiFuture<QuerySnapshot> future = sigRef.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        System.out.println("DEBUG: Trouvé " + documents.size() + " signalement(s) dans Firestore");

        int count = 0;
        for (QueryDocumentSnapshot document : documents) {
            try {
                SignalementSyncDto dto = document.toObject(SignalementSyncDto.class);
                Signalement sig = dto.toEntity(utilisateurRepository);
                signalementRepository.save(sig);

                FirebaseSync sync = new FirebaseSync();
                sync.setTypeDonnee("SIGNALEMENT");
                sync.setIdReference(sig.getId());
                sync.setSens(SyncType.PULL);
                sync.setDateSync(LocalDateTime.now());
                syncRepository.save(sync);
                count++;
            } catch (Exception e) {
                System.err.println("Erreur lors de la lecture du signalement " + document.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        return count;
    }

    /**
     * Importe le fichier firebase-import.json local vers Firestore
     */
    public void seedFirebaseFromLocalJson() throws IOException, ExecutionException, InterruptedException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré.");
        }
        
        File file = new File("firebase-import.json");
        if (!file.exists()) {
            throw new IOException("Le fichier firebase-import.json est introuvable à la racine.");
        }

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> data = mapper.readValue(file, new TypeReference<Map<String, Object>>(){});
        
        // Import utilisateurs
        if (data.containsKey("utilisateurs")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> utilisateurs = (Map<String, Object>) data.get("utilisateurs");
            CollectionReference usersRef = getFirestore().collection("utilisateurs");
            
            for (Map.Entry<String, Object> entry : utilisateurs.entrySet()) {
                usersRef.document(entry.getKey()).set(entry.getValue()).get();
            }
            System.out.println("✅ " + utilisateurs.size() + " utilisateur(s) importé(s)");
        }
        
        // Import signalements
        if (data.containsKey("signalements")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> signalements = (Map<String, Object>) data.get("signalements");
            CollectionReference sigRef = getFirestore().collection("signalements");
            
            for (Map.Entry<String, Object> entry : signalements.entrySet()) {
                sigRef.document(entry.getKey()).set(entry.getValue()).get();
            }
            System.out.println("✅ " + signalements.size() + " signalement(s) importé(s)");
        }
    }

    /**
     * Récupérer l'historique de synchronisation
     */
    public List<FirebaseSync> getSyncHistory(String typeDonnee) {
        return syncRepository.findByTypeDonneeAndSens(typeDonnee, null);
    }
    
    /**
     * Convertir un objet DTO en Map pour Firestore
     */
    private Map<String, Object> convertToMap(Object dto) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(dto, new TypeReference<Map<String, Object>>(){});
    }
}
