package com.cloud.web.auth;

import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAttemptService {

    private final UserRepository userRepository;
    private final FirebaseAuth firebaseAuth;
    private final int maxLoginAttempts;

    public LoginAttemptService(UserRepository userRepository,
                               FirebaseAuth firebaseAuth,
                               @Value("${auth.maxLoginAttempts:3}") int maxLoginAttempts) {
        this.userRepository = userRepository;
        this.firebaseAuth = firebaseAuth;
        this.maxLoginAttempts = maxLoginAttempts;
    }

    @Transactional
    public void recordFailedLogin(String email) {
        String normalized = email.toLowerCase();
        var userOpt = userRepository.findByEmail(normalized);
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();
        if (user.isLockedNow()) {
            return;
        }

        int attempts = user.getTentativesEchouees() + 1;
        user.setTentativesEchouees(attempts);

        if (attempts >= maxLoginAttempts) {
            user.setEstBloque(true);
            disableFirebaseUserByEmail(normalized);
        }

        userRepository.save(user);
    }

    @Transactional
    public void resetAttempts(String email) {
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
}
