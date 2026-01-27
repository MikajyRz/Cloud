package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.security.JwtService;
import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import com.cloud.web.utilisateur.RoleUtilisateur;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final int maxLoginAttempts;
    private final int lockMinutes;

    public AuthService(UtilisateurRepository utilisateurRepository,
                       AuthSessionRepository authSessionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${auth.maxLoginAttempts:3}") int maxLoginAttempts,
                       @Value("${auth.lockMinutes:15}") int lockMinutes) {
        this.utilisateurRepository = utilisateurRepository;
        this.authSessionRepository = authSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.maxLoginAttempts = maxLoginAttempts;
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
            if (attempts >= maxLoginAttempts) {
                utilisateur.setEstBloque(true);
            }
            utilisateurRepository.save(utilisateur);
            throw new IllegalArgumentException("Identifiants invalides");
        }

        utilisateur.setTentativesEchouees(0);
        utilisateur.setEstBloque(false);
        utilisateurRepository.save(utilisateur);

        var issued = jwtService.issueToken(utilisateur.getEmail(), Map.of("role", utilisateur.getRole().name()));

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
    }
}
