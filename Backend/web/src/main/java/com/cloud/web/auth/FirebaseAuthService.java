package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.cloud.web.user.UserRole;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "auth.mode", havingValue = "online")
public class FirebaseAuthService implements AuthFacade {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;

    public FirebaseAuthService(FirebaseAuth firebaseAuth, UserRepository userRepository) {
        this.firebaseAuth = firebaseAuth;
        this.userRepository = userRepository;
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
        throw new IllegalStateException("Online mode: login is handled by Firebase on the client; send Firebase ID token to the API");
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
}
