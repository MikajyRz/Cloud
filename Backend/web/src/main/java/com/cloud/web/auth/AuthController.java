package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.FailedLoginRequest;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.ResetAttemptsRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.auth.dto.UnlockRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthFacade authService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(AuthFacade authService, LoginAttemptService loginAttemptService) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/failed-login")
    public ResponseEntity<Void> failedLogin(@Valid @RequestBody FailedLoginRequest req) {
        loginAttemptService.recordFailedLogin(req.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-attempts")
    public ResponseEntity<Void> resetAttempts(@Valid @RequestBody ResetAttemptsRequest req, Authentication auth) {
        String principal = auth != null ? auth.getName() : null;
        if (principal == null || !principal.equalsIgnoreCase(req.getEmail())) {
            throw new IllegalStateException("Forbidden");
        }
        loginAttemptService.resetAttempts(req.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unlock")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> unlock(@Valid @RequestBody UnlockRequest req) {
        authService.unlockUser(req.getEmail());
        return ResponseEntity.ok().build();
    }
}
