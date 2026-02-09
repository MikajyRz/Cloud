package com.cloud.web.notification;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Crée une notification quand un manager change le statut d'un signalement.
     * La notification est visible par TOUS les utilisateurs mobiles.
     */
    @Transactional
    public Notification creerNotificationChangementStatut(UUID signalementId, String titreSignalement, 
                                                          String ancienStatut, String nouveauStatut) {
        String titre = "Statut modifié : " + titreSignalement;
        String message = "Le signalement \"" + titreSignalement + "\" est passé de " 
                         + formatStatut(ancienStatut) + " à " + formatStatut(nouveauStatut);

        Notification notif = new Notification();
        notif.setTitre(titre);
        notif.setMessage(message);
        notif.setSignalementId(signalementId);
        notif.setDateCreation(LocalDateTime.now());
        notif.setLu(false);

        notif = notificationRepository.save(notif);

        // Sync vers Firestore pour que le mobile puisse les lire
        syncToFirestore(notif);

        return notif;
    }

    public List<NotificationDto> getAllNotifications() {
        return notificationRepository.findAllByOrderByDateCreationDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public long countUnread() {
        return notificationRepository.countByLuFalse();
    }

    @Transactional
    public void markAsRead(UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setLu(true);
            notificationRepository.save(n);
            // Mettre à jour dans Firestore aussi
            syncToFirestore(n);
        });
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findAllByOrderByDateCreationDesc()
                .stream().filter(n -> !n.isLu()).toList();
        for (Notification n : unread) {
            n.setLu(true);
            notificationRepository.save(n);
            syncToFirestore(n);
        }
    }

    private void syncToFirestore(Notification notif) {
        try {
            if (FirebaseApp.getApps() == null || FirebaseApp.getApps().isEmpty()) return;
            Firestore firestore = FirestoreClient.getFirestore();
            Map<String, Object> data = new HashMap<>();
            data.put("titre", notif.getTitre());
            data.put("message", notif.getMessage());
            data.put("signalementId", notif.getSignalementId() != null ? notif.getSignalementId().toString() : null);
            data.put("dateCreation", notif.getDateCreation().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            data.put("lu", notif.isLu());
            firestore.collection("notifications").document(notif.getId().toString()).set(data);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur sync notification Firestore: " + e.getMessage());
        }
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitre(),
                n.getMessage(),
                n.getSignalementId(),
                n.getDateCreation().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                n.isLu()
        );
    }

    private String formatStatut(String statut) {
        if (statut == null) return "Inconnu";
        return switch (statut) {
            case "NOUVEAU" -> "Nouveau";
            case "EN_ATTENTE" -> "En attente";
            case "EN_COURS" -> "En cours";
            case "TERMINE" -> "Terminé";
            case "ANNULE" -> "Annulé";
            default -> statut;
        };
    }
}
