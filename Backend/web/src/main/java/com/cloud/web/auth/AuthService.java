package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.security.JwtService;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import com.cloud.web.utilisateur.RoleUtilisateur;
import com.cloud.web.sync.dto.UtilisateurSyncDto;
import com.cloud.web.config.AppConfigService;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppConfigService appConfigService;

    private final int defaultMaxLoginAttempts;
    private final int lockMinutes;

    public AuthService(UtilisateurRepository utilisateurRepository,
                       AuthSessionRepository authSessionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AppConfigService appConfigService,
                       @Value("${auth.maxLoginAttempts:3}") int defaultMaxLoginAttempts,
                       @Value("${auth.lockMinutes:15}") int lockMinutes) {
        this.utilisateurRepository = utilisateurRepository;
        this.authSessionRepository = authSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.appConfigService = appConfigService;
        this.defaultMaxLoginAttempts = defaultMaxLoginAttempts;
        this.lockMinutes = lockMinutes;
    }

    @Transactional
    public void signup(SignupRequest req) {
        if (utilisateurRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(req.getEmail().toLowerCase());
        utilisateur.setNomComplet(req.getFullName());
        utilisateur.setMotDePasse(passwordEncoder.encode(req.getPassword()));
        utilisateur.setRole(RoleUtilisateur.UTILISATEUR);
        utilisateur.setTentativesEchouees(0);
        utilisateur.setEstBloque(false);
        utilisateurRepository.save(utilisateur);
    }

    @Transactional(noRollbackFor = {IllegalArgumentException.class, IllegalStateException.class})
    public AuthResponse login(LoginRequest req) {
        var userOpt = utilisateurRepository.findByEmail(req.getEmail().toLowerCase());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Identifiants invalides");
        }
        Utilisateur utilisateur = userOpt.get();
        if (utilisateur.estBloqueMaintenant()) {
            throw new IllegalStateException("Compte bloqué");
        }

        boolean ok = passwordEncoder.matches(req.getPassword(), utilisateur.getMotDePasse());
        if (!ok) {
            int attempts = utilisateur.getTentativesEchouees() + 1;
            utilisateur.setTentativesEchouees(attempts);
            int maxLoginAttempts = appConfigService.getConfigValueAsInt("auth.max.login.attempts", defaultMaxLoginAttempts);
            if (attempts >= maxLoginAttempts) {
                utilisateur.setEstBloque(true);
                
                // Synchroniser le blocage vers Firestore
                try {
                    Firestore firestore = FirestoreClient.getFirestore();
                    String docId = utilisateur.getEmail().replace(".", "_");
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("estBloque", true);
                    updates.put("tentativesEchouees", attempts);
                    firestore.collection("utilisateurs").document(docId).update(updates);
                    System.out.println("⚠️ Utilisateur bloqué et synchronisé vers Firestore: " + utilisateur.getEmail());
                } catch (Exception e) {
                    System.err.println("⚠️ Erreur sync Firestore blocage: " + e.getMessage());
                }
            }
            utilisateurRepository.save(utilisateur);
            throw new IllegalArgumentException("Identifiants invalides");
        }

        utilisateur.setTentativesEchouees(0);
        utilisateur.setEstBloque(false);
        utilisateurRepository.save(utilisateur);

        int sessionDurationMinutes = appConfigService.getConfigValueAsInt("session.duration.minutes", 30);
        var issued = jwtService.issueTokenWithDuration(utilisateur.getEmail(), 
            Map.of("role", utilisateur.getRole().name()), 
            sessionDurationMinutes);

        AuthSession session = new AuthSession();
        session.setUtilisateur(utilisateur);
        session.setToken(issued.token());
        session.setExpiresAt(issued.expiresAt());
        authSessionRepository.save(session);

        return new AuthResponse(issued.token(), issued.expiresAt());
    }

    @Transactional
    public void unlockUser(String email) {
        var userOpt = utilisateurRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            return;
        }
        Utilisateur utilisateur = userOpt.get();
        utilisateur.setTentativesEchouees(0);
        utilisateur.setEstBloque(false);
        utilisateurRepository.save(utilisateur);
        
        // Synchroniser vers Firestore
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            UtilisateurSyncDto dto = new UtilisateurSyncDto(utilisateur);
            Map<String, Object> userData = new HashMap<>();
            userData.put("nom", dto.getNom() != null ? dto.getNom() : "");
            userData.put("prenom", dto.getPrenom() != null ? dto.getPrenom() : "");
            userData.put("email", dto.getEmail());
            userData.put("motDePasse", dto.getMotDePasse() != null ? dto.getMotDePasse() : "");
            userData.put("role", dto.getRole());
            userData.put("telephone", dto.getTelephone() != null ? dto.getTelephone() : "");
            userData.put("estBloque", false);
            userData.put("tentativesEchouees", 0);
            
            String docId = utilisateur.getEmail().replace(".", "_");
            firestore.collection("utilisateurs").document(docId).set(userData);
            System.out.println("✅ Utilisateur débloqué et synchronisé vers Firestore: " + email);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur sync Firestore unlock: " + e.getMessage());
        }
    }
}
