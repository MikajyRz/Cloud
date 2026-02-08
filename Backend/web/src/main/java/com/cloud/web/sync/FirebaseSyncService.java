package com.cloud.web.sync;

import com.cloud.web.signalement.Signalement;
import com.cloud.web.signalement.SignalementRepository;
import com.cloud.web.signalement.StatutTravaux;
import com.cloud.web.sync.dto.SignalementSyncDto;
import com.cloud.web.sync.dto.SyncResultDto;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseSyncService {

    private final FirebaseSyncRepository syncRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SignalementRepository signalementRepository;
    private final SyncPersistenceService syncPersistenceService;
    private Firestore firestore;

    public FirebaseSyncService(
            FirebaseSyncRepository syncRepository,
            UtilisateurRepository utilisateurRepository,
            SignalementRepository signalementRepository,
            SyncPersistenceService syncPersistenceService) {
        this.syncRepository = syncRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.signalementRepository = signalementRepository;
        this.syncPersistenceService = syncPersistenceService;
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
    public int pullSignalementsFromFirebase() throws InterruptedException, ExecutionException {
        if (!isFirebaseAvailable()) {
            throw new IllegalStateException("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
        }
        
        CollectionReference sigRef = getFirestore().collection("signalements");
        ApiFuture<QuerySnapshot> future = sigRef.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        System.out.println("DEBUG: Trouvé " + documents.size() + " signalement(s) dans Firestore");

        int count = 0;
        int errorCount = 0;
        for (QueryDocumentSnapshot document : documents) {
            try {
                String docId = document.getId();
                UUID sigId;
                
                // Essayer de parser comme UUID, sinon générer un UUID déterministe à partir de l'ID Firestore
                try {
                    sigId = UUID.fromString(docId);
                } catch (IllegalArgumentException e) {
                    // Générer un UUID v5 (basé sur le nom) à partir de l'ID Firestore
                    sigId = UUID.nameUUIDFromBytes(docId.getBytes());
                    System.out.println("ℹ️ Signalement " + docId + " converti en UUID: " + sigId);
                }
                
                SignalementSyncDto dto = document.toObject(SignalementSyncDto.class);
                
                // Sauvegarder dans une transaction séparée
                if (saveSignalementFromFirestore(sigId, dto)) {
                    count++;
                }
            } catch (Exception e) {
                System.err.println("⚠️ Erreur signalement " + document.getId() + " : " + e.getMessage());
                errorCount++;
                // Continue pour traiter les autres documents
            }
        }
        System.out.println("✅ Sync terminé : " + count + " signalement(s) synchronisé(s), " + errorCount + " erreur(s)");
        return count;
    }

    public boolean saveSignalementFromFirestore(UUID sigId, SignalementSyncDto dto) {
        try {
            // Déléguer au service de persistence qui gère la transaction
            return syncPersistenceService.saveSignalement(sigId, dto, utilisateurRepository);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur sauvegarde signalement " + sigId + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
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
     * SYNCHRONISATION BIDIRECTIONNELLE COMPLÈTE
     * 
     * Règles de synchronisation :
     * 1. Nouvelles données dans Firestore (absentes dans PostgreSQL) → INSERT dans PostgreSQL
     * 2. Données existantes dans les deux systèmes avec différences → PostgreSQL prioritaire → UPDATE Firestore
     * 3. Modifications depuis frontend (stockées dans PostgreSQL) → UPDATE Firestore
     * 
     * @return SyncResultDto avec statistiques et logs de la synchronisation
     */
    public SyncResultDto synchronizeBidirectional() throws ExecutionException, InterruptedException {
        SyncResultDto result = new SyncResultDto();
        
        if (!isFirebaseAvailable()) {
            result.setSuccess(false);
            result.setMessage("Firebase n'est pas configuré. Téléchargez firebase-admin.json");
            result.addError("Firebase non disponible");
            return result;
        }

        try {
            result.addLog("🔄 Début de la synchronisation bidirectionnelle");
            
            // Synchronisation des utilisateurs
            syncUtilisateursBidirectional(result);
            
            // Synchronisation des signalements
            syncSignalementsBidirectional(result);
            
            result.setSuccess(true);
            result.setMessage(String.format(
                "Synchronisation réussie : %d utilisateur(s) (%d nouveaux, %d mis à jour), %d signalement(s) (%d nouveaux, %d mis à jour)",
                result.getUtilisateurs().getTotal(),
                result.getUtilisateurs().getNouveauxDepuisFirestore(),
                result.getUtilisateurs().getMisAJourVersFirestore(),
                result.getSignalements().getTotal(),
                result.getSignalements().getNouveauxDepuisFirestore(),
                result.getSignalements().getMisAJourVersFirestore()
            ));
            result.addLog("✅ Synchronisation terminée avec succès");
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setMessage("Erreur lors de la synchronisation : " + e.getMessage());
            result.addError("Exception : " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }

    /**
     * Synchronisation bidirectionnelle des utilisateurs
     */
    private void syncUtilisateursBidirectional(SyncResultDto result) throws ExecutionException, InterruptedException {
        result.addLog("📋 Synchronisation des utilisateurs...");
        
        // Récupérer tous les utilisateurs de Firestore
        CollectionReference usersRef = getFirestore().collection("utilisateurs");
        ApiFuture<QuerySnapshot> future = usersRef.get();
        List<QueryDocumentSnapshot> firestoreDocs = future.get().getDocuments();
        
        // Récupérer tous les utilisateurs de PostgreSQL
        List<Utilisateur> pgUsers = utilisateurRepository.findAll();
        
        // Map pour accès rapide par email
        Map<String, Utilisateur> pgUserMap = new HashMap<>();
        for (Utilisateur u : pgUsers) {
            pgUserMap.put(u.getEmail().toLowerCase(), u);
        }
        
        // Traiter les utilisateurs Firestore
        for (QueryDocumentSnapshot doc : firestoreDocs) {
            try {
                Map<String, Object> data = doc.getData();
                String email = ((String) data.get("email")).toLowerCase();
                
                Utilisateur pgUser = pgUserMap.get(email);
                
                if (pgUser == null) {
                    // CAS 1 : Nouvelle donnée dans Firestore → INSERT dans PostgreSQL
                    UtilisateurSyncDto dto = new UtilisateurSyncDto();
                    dto.setEmail(email);
                    dto.setNom((String) data.get("nom"));
                    dto.setPrenom((String) data.get("prenom"));
                    dto.setMotDePasse((String) data.get("motDePasse"));
                    dto.setRole((String) data.get("role"));
                    dto.setTelephone((String) data.get("telephone"));
                    
                    Utilisateur newUser = dto.toEntity();
                    utilisateurRepository.save(newUser);
                    
                    result.getUtilisateurs().incrementNouveaux();
                    result.addLog("➕ Nouvel utilisateur importé : " + email);
                    
                    // Log la synchronisation
                    logSync("UTILISATEUR", UUID.nameUUIDFromBytes(email.getBytes()), SyncType.PULL);
                    
                } else {
                    // CAS 2 : Donnée existante → Vérifier s'il y a des différences
                    if (hasUserChanged(pgUser, data)) {
                        // PostgreSQL prioritaire → Mettre à jour Firestore
                        UtilisateurSyncDto dto = new UtilisateurSyncDto(pgUser);
                        Map<String, Object> userData = convertToMap(dto);
                        
                        String docId = pgUser.getEmail().replace(".", "_");
                        usersRef.document(docId).set(userData).get();
                        
                        result.getUtilisateurs().incrementMisAJour();
                        result.addLog("🔄 Utilisateur mis à jour vers Firestore : " + email);
                        
                        // Log la synchronisation
                        logSync("UTILISATEUR", UUID.nameUUIDFromBytes(email.getBytes()), SyncType.PUSH);
                    }
                }
                
                // Retirer de la map pour identifier les utilisateurs qui n'existent que dans PostgreSQL
                pgUserMap.remove(email);
                
            } catch (Exception e) {
                result.addError("Erreur utilisateur " + doc.getId() + " : " + e.getMessage());
            }
        }
        
        // CAS 3 : Utilisateurs présents uniquement dans PostgreSQL → PUSH vers Firestore
        for (Utilisateur pgUser : pgUserMap.values()) {
            try {
                UtilisateurSyncDto dto = new UtilisateurSyncDto(pgUser);
                Map<String, Object> userData = convertToMap(dto);
                
                String docId = pgUser.getEmail().replace(".", "_");
                usersRef.document(docId).set(userData).get();
                
                result.getUtilisateurs().incrementMisAJour();
                result.addLog("📤 Utilisateur poussé vers Firestore : " + pgUser.getEmail());
                
                // Log la synchronisation
                logSync("UTILISATEUR", UUID.nameUUIDFromBytes(pgUser.getEmail().getBytes()), SyncType.PUSH);
                
            } catch (Exception e) {
                result.addError("Erreur PUSH utilisateur " + pgUser.getEmail() + " : " + e.getMessage());
            }
        }
    }

    /**
     * Synchronisation bidirectionnelle des signalements
     */
    private void syncSignalementsBidirectional(SyncResultDto result) throws ExecutionException, InterruptedException {
        result.addLog("📋 Synchronisation des signalements...");
        
        // Récupérer tous les signalements de Firestore
        CollectionReference sigRef = getFirestore().collection("signalements");
        ApiFuture<QuerySnapshot> future = sigRef.get();
        List<QueryDocumentSnapshot> firestoreDocs = future.get().getDocuments();
        
        // Récupérer tous les signalements de PostgreSQL
        List<Signalement> pgSignalements = signalementRepository.findAll();
        
        // Map pour accès rapide par UUID
        Map<UUID, Signalement> pgSigMap = new HashMap<>();
        for (Signalement sig : pgSignalements) {
            pgSigMap.put(sig.getId(), sig);
        }
        
        // Traiter les signalements Firestore
        for (QueryDocumentSnapshot doc : firestoreDocs) {
            try {
                String idStr = doc.getId();
                UUID firestoreId = UUID.fromString(idStr);
                
                Signalement pgSignalement = pgSigMap.get(firestoreId);
                
                if (pgSignalement == null) {
                    // CAS 1 : Nouveau signalement dans Firestore → INSERT dans PostgreSQL
                    SignalementSyncDto dto = doc.toObject(SignalementSyncDto.class);
                    dto.setId(idStr); // S'assurer que l'ID est préservé
                    
                    Signalement newSignalement = dto.toEntity(utilisateurRepository);
                    syncPersistenceService.insertSignalement(newSignalement);
                    
                    result.getSignalements().incrementNouveaux();
                    result.addLog("➕ Nouveau signalement importé : " + idStr);
                    
                    // Log la synchronisation
                    logSync("SIGNALEMENT", firestoreId, SyncType.PULL);
                    
                } else {
                    // CAS 2 : Signalement existant → Vérifier s'il y a des différences
                    Map<String, Object> firestoreData = doc.getData();
                    if (hasSignalementChanged(pgSignalement, firestoreData)) {
                        // PostgreSQL prioritaire → Mettre à jour Firestore
                        SignalementSyncDto dto = new SignalementSyncDto(pgSignalement);
                        Map<String, Object> sigData = convertToMap(dto);
                        
                        sigRef.document(idStr).set(sigData).get();
                        
                        result.getSignalements().incrementMisAJour();
                        result.addLog("🔄 Signalement mis à jour vers Firestore : " + idStr);
                        
                        // Log la synchronisation
                        logSync("SIGNALEMENT", firestoreId, SyncType.PUSH);
                    }
                }
                
                // Retirer de la map
                pgSigMap.remove(firestoreId);
                
            } catch (Exception e) {
                result.addError("Erreur signalement " + doc.getId() + " : " + e.getMessage());
            }
        }
        
        // CAS 3 : Signalements présents uniquement dans PostgreSQL → PUSH vers Firestore
        for (Signalement pgSig : pgSigMap.values()) {
            try {
                SignalementSyncDto dto = new SignalementSyncDto(pgSig);
                Map<String, Object> sigData = convertToMap(dto);
                
                sigRef.document(pgSig.getId().toString()).set(sigData).get();
                
                result.getSignalements().incrementMisAJour();
                result.addLog("📤 Signalement poussé vers Firestore : " + pgSig.getId());
                
                // Log la synchronisation
                logSync("SIGNALEMENT", pgSig.getId(), SyncType.PUSH);
                
            } catch (Exception e) {
                result.addError("Erreur PUSH signalement " + pgSig.getId() + " : " + e.getMessage());
            }
        }
    }

    /**
     * Vérifier si un utilisateur a changé entre Firestore et PostgreSQL
     */
    private boolean hasUserChanged(Utilisateur pgUser, Map<String, Object> firestoreData) {
        String fsNom = (String) firestoreData.get("nom");
        String fsPrenom = (String) firestoreData.get("prenom");
        String fsRole = (String) firestoreData.get("role");
        String fsTelephone = (String) firestoreData.get("telephone");
        
        return !Objects.equals(pgUser.getNom(), fsNom) ||
               !Objects.equals(pgUser.getPrenom(), fsPrenom) ||
               !pgUser.getRole().name().equals(fsRole) ||
               !Objects.equals(pgUser.getTelephone(), fsTelephone);
    }

    /**
     * Vérifier si un signalement a changé entre Firestore et PostgreSQL
     */
    private boolean hasSignalementChanged(Signalement pgSig, Map<String, Object> firestoreData) {
        String fsTitre = (String) firestoreData.get("titre");
        String fsDescription = (String) firestoreData.get("description");
        String fsStatut = (String) firestoreData.get("statut");
        
        return !Objects.equals(pgSig.getTitre(), fsTitre) ||
               !Objects.equals(pgSig.getDescription(), fsDescription) ||
               !pgSig.getStatut().name().equals(fsStatut);
    }

    /**
     * Logger une synchronisation dans la base de données
     */
    private void logSync(String typeDonnee, UUID idReference, SyncType sens) {
        try {
            FirebaseSync sync = new FirebaseSync();
            sync.setTypeDonnee(typeDonnee);
            sync.setIdReference(idReference);
            sync.setSens(sens);
            sync.setDateSync(LocalDateTime.now());
            syncRepository.save(sync);
        } catch (Exception e) {
            System.err.println("Erreur lors du logging de la sync : " + e.getMessage());
        }
    }
    
    /**
     * Convertir un objet DTO en Map pour Firestore
     */
    private Map<String, Object> convertToMap(Object dto) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(dto, new TypeReference<Map<String, Object>>(){});
    }
}
