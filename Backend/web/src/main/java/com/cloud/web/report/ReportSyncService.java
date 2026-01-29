package com.cloud.web.report;

import com.cloud.web.report.dto.SyncReportsResponse;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloud.web.user.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class ReportSyncService {

    private final Firestore firestore;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    private final String firestoreCollection;

    public ReportSyncService(
            Firestore firestore,
            ReportRepository reportRepository,
            UserRepository userRepository,
            @Value("${firestore.reports.collection:signalements}") String firestoreCollection
    ) {
        this.firestore = firestore;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.firestoreCollection = firestoreCollection;
    }

    @Transactional
    public SyncReportsResponse sync() {
        QuerySnapshot snap;
        try {
            snap = firestore.collection(firestoreCollection).get().get();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot fetch Firestore collection: " + firestoreCollection, ex);
        }

        int fetched = snap.size();
        int inserted = 0;
        int updated = 0;

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

            if (isNew) {
                inserted++;
            } else {
                updated++;
            }
        }

        return new SyncReportsResponse(fetched, inserted, updated, firestoreCollection);
    }
}
