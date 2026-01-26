package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;

public interface AuthFacade {
    void signup(SignupRequest req);

    AuthResponse login(LoginRequest req);

    void unlockUser(String email);
}
