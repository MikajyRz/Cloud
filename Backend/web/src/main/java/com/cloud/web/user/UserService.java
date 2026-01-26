package com.cloud.web.user;

import com.cloud.web.user.dto.UpdateMeRequest;
import com.cloud.web.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new UserResponse(user.getEmail(), user.getNom(), user.getPrenom(), user.getRole());
    }

    @Transactional
    public UserResponse updateMe(String email, UpdateMeRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setNom(req.getNom());
        user.setPrenom(req.getPrenom());
        userRepository.save(user);
        return new UserResponse(user.getEmail(), user.getNom(), user.getPrenom(), user.getRole());
    }
}
