package com.cloud.web.auth;

import com.cloud.web.auth.dto.AuthResponse;
import com.cloud.web.auth.dto.LoginRequest;
import com.cloud.web.auth.dto.SignupRequest;
import com.cloud.web.auth.dto.UnlockRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    @PostMapping("/unlock")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> unlock(@Valid @RequestBody UnlockRequest req) {
        authService.unlockUser(req.getEmail());
        return ResponseEntity.ok().build();
    }
}
