package com.cloud.web.report;

import com.cloud.web.report.dto.SyncReportsResponse;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloud.web.user.FirebaseUserSyncService;
import com.cloud.web.user.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReportSyncService {

    private final Firestore firestore;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ObjectProvider<FirebaseUserSyncService> firebaseUserSyncService;

    private final String firestoreCollection;

    public ReportSyncService(
            Firestore firestore,
            ReportRepository reportRepository,
            UserRepository userRepository,
            ObjectProvider<FirebaseUserSyncService> firebaseUserSyncService,
            @Value("${firestore.reports.collection:signalements}") String firestoreCollection
    ) {
        this.firestore = firestore;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.firebaseUserSyncService = firebaseUserSyncService;
        this.firestoreCollection = firestoreCollection;
    }

    @Transactional
    public SyncReportsResponse sync() {
        FirebaseUserSyncService userSync = firebaseUserSyncService.getIfAvailable();
        if (userSync != null) {
            userSync.syncAllUsersToPostgres();
        }

        QuerySnapshot snap;
        try {
            snap = firestore.collection(firestoreCollection).get().get();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot fetch Firestore collection: " + firestoreCollection, ex);
        }

        int fetched = snap.size();
        int inserted = 0;
        int updated = 0;
        int pushed = 0;

        for (DocumentSnapshot doc : snap.getDocuments()) {
            String firestoreId = doc.getId();

            Report r = reportRepository.findByFirestoreId(firestoreId).orElseGet(() -> {
                Report created = new Report();
                created.setFirestoreId(firestoreId);
                created.setStatut(StatutTravaux.NOUVEAU);
                return created;
            });

            boolean isNew = r.getId() == null;

            r.setTitre(doc.getString("titre"));
            r.setDescription(doc.getString("description"));

            Double lat = doc.getDouble("latitude");
            Double lng = doc.getDouble("longitude");
            if (lat != null) r.setLatitude(BigDecimal.valueOf(lat));
            if (lng != null) r.setLongitude(BigDecimal.valueOf(lng));

            String userEmail = doc.getString("userEmail");
            if (userEmail != null && !userEmail.isBlank()) {
                userRepository.findByEmail(userEmail.toLowerCase())
                        .ifPresent(u -> r.setIdUtilisateur(u.getId()));
            }

            Object createdAtObj = doc.get("createdAt");
            if (createdAtObj instanceof Timestamp ts) {
                r.setDateSignalement(Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos()));
            } else if (r.getDateSignalement() == null) {
                r.setDateSignalement(Instant.now());
            }

            reportRepository.save(r);

            // Push enriched fields back to Firestore so mobile can display reference data.
            // Uses Admin SDK => not constrained by client rules.
            try {
                Map<String, Object> patch = new HashMap<>();
                if (r.getStatut() != null) patch.put("statut", r.getStatut().name());
                if (r.getSurfaceM2() != null) patch.put("surfaceM2", r.getSurfaceM2().doubleValue());
                if (r.getBudget() != null) patch.put("budget", r.getBudget().doubleValue());
                if (r.getIdEntreprise() != null) patch.put("idEntreprise", r.getIdEntreprise().toString());
                if (r.getIdUtilisateur() != null) patch.put("idUtilisateur", r.getIdUtilisateur().toString());
                if (r.getDateSignalement() != null) patch.put("dateSignalement", r.getDateSignalement().toString());

                if (!patch.isEmpty()) {
                    firestore.collection(firestoreCollection)
                            .document(firestoreId)
                            .set(patch, SetOptions.merge())
                            .get();
                    pushed++;
                }
            } catch (Exception ignored) {
                // Do not fail the whole sync if Firestore write-back fails for one document.
            }

            if (isNew) {
                inserted++;
            } else {
                updated++;
            }
        }

        return new SyncReportsResponse(fetched, inserted, updated, pushed, firestoreCollection);
    }
}
