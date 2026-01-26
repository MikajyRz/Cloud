package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.security.JwtService;
import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.cloud.web.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Offline implementation of AuthFacade, enabled only when auth.mode=offline (default)
 */
@Service
@ConditionalOnProperty(name = "auth.mode", havingValue = "offline", matchIfMissing = true)
public class AuthService implements AuthFacade {

    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final int maxLoginAttempts;
    private final int lockMinutes;

    public AuthService(UserRepository userRepository,
                       AuthSessionRepository authSessionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${auth.maxLoginAttempts:3}") int maxLoginAttempts,
                       @Value("${auth.lockMinutes:15}") int lockMinutes) {
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.maxLoginAttempts = maxLoginAttempts;
        this.lockMinutes = lockMinutes;
    }

    @Transactional
    @Override
    public void signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already used");
        }
        User user = new User();
        user.setEmail(req.getEmail().toLowerCase());
        user.setNom(req.getFullName());
        user.setPrenom(null);
        user.setMotDePasse(passwordEncoder.encode(req.getPassword()));
        user.setRole(UserRole.UTILISATEUR);
        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        userRepository.save(user);
    }

    @Transactional(noRollbackFor = {IllegalArgumentException.class, IllegalStateException.class})
    @Override
    public AuthResponse login(LoginRequest req) {
        var userOpt = userRepository.findByEmail(req.getEmail().toLowerCase());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User user = userOpt.get();
        if (user.isLockedNow()) {
            throw new IllegalStateException("Account locked");
        }

        boolean ok = passwordMatches(req.getPassword(), user.getMotDePasse());
        if (!ok) {
            int attempts = user.getTentativesEchouees() + 1;
            user.setTentativesEchouees(attempts);
            if (attempts >= maxLoginAttempts) {
                user.setEstBloque(true);
            }
            userRepository.save(user);
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        userRepository.save(user);

        var issued = jwtService.issueToken(user.getEmail(), Map.of("role", user.getRole().name()));

        AuthSession session = new AuthSession();
        session.setIdUtilisateur(user.getId());
        session.setToken(issued.token());
        session.setDateCreation(Instant.now());
        session.setDateExpiration(issued.expiresAt());
        authSessionRepository.save(session);

        return new AuthResponse(issued.token(), issued.expiresAt());
    }

    @Transactional
    @Override
    public void unlockUser(String email) {
        var userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();
        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        userRepository.save(user);
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }
        return storedPassword.equals(rawPassword);
    }
}
