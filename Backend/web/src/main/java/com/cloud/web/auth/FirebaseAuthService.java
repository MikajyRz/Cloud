package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.security.JwtService;
import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.cloud.web.user.UserRole;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "auth.mode", havingValue = "online")
public class FirebaseAuthService implements AuthFacade {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final JwtService jwtService;
    private final RestClient restClient;
    private final String firebaseApiKey;
    private final int maxLoginAttempts;

    public FirebaseAuthService(FirebaseAuth firebaseAuth,
                               UserRepository userRepository,
                               AuthSessionRepository authSessionRepository,
                               JwtService jwtService,
                               @Value("${firebase.apiKey:}") String firebaseApiKey,
                               @Value("${auth.maxLoginAttempts:3}") int maxLoginAttempts) {
        this.firebaseAuth = firebaseAuth;
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
        this.jwtService = jwtService;
        this.firebaseApiKey = firebaseApiKey;
        this.maxLoginAttempts = maxLoginAttempts;
        this.restClient = RestClient.create();
    }

    @Transactional
    @Override
    public void signup(SignupRequest req) {
        String email = req.getEmail().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already used");
        }

        try {
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(req.getPassword())
                    .setEmailVerified(false)
                    .setDisabled(false);

            firebaseAuth.createUser(createRequest);

        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot create Firebase user", ex);
        }

        User user = new User();
        user.setEmail(email);
        user.setNom(req.getFullName());
        user.setPrenom(null);
        user.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
        user.setRole(UserRole.UTILISATEUR);
        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        userRepository.save(user);
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail().toLowerCase();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        User user = userOpt.get();
        if (user.isLockedNow()) {
            throw new IllegalStateException("Account locked");
        }

        if (firebaseApiKey == null || firebaseApiKey.isBlank()) {
            throw new IllegalStateException("Missing firebase.apiKey configuration");
        }

        try {
            FirebaseSignInResponse resp = restClient.post()
                    .uri("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={key}", firebaseApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(new FirebaseSignInRequest(email, req.getPassword(), true))
                    .retrieve()
                    .body(FirebaseSignInResponse.class);

            if (resp == null || resp.localId() == null || resp.localId().isBlank()) {
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

        } catch (RestClientResponseException ex) {
            int attempts = user.getTentativesEchouees() + 1;
            user.setTentativesEchouees(attempts);
            if (attempts >= maxLoginAttempts) {
                user.setEstBloque(true);
                disableFirebaseUserByEmail(email);
            }
            userRepository.save(user);

            if (user.isLockedNow()) {
                throw new IllegalStateException("Account locked");
            }
            throw new IllegalArgumentException("Invalid credentials");
        }
    }

    @Transactional
    @Override
    public void unlockUser(String email) {
        String normalized = email.toLowerCase();
        var userOpt = userRepository.findByEmail(normalized);
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();
        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        userRepository.save(user);

        enableFirebaseUserByEmail(normalized);
    }

    private void disableFirebaseUserByEmail(String email) {
        try {
            UserRecord record = firebaseAuth.getUserByEmail(email);
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(record.getUid()).setDisabled(true));
        } catch (Exception ignored) {
        }
    }

    private void enableFirebaseUserByEmail(String email) {
        try {
            UserRecord record = firebaseAuth.getUserByEmail(email);
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(record.getUid()).setDisabled(false));
        } catch (Exception ignored) {
        }
    }

    private record FirebaseSignInRequest(String email, String password, boolean returnSecureToken) {
    }

    private record FirebaseSignInResponse(String localId) {
    }
}
