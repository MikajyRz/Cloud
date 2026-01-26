package com.cloud.web.user;

import com.cloud.web.user.dto.UpdateMeRequest;
import com.cloud.web.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        return ResponseEntity.ok(userService.me(auth.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(Authentication auth, @Valid @RequestBody UpdateMeRequest req) {
        return ResponseEntity.ok(userService.updateMe(auth.getName(), req));
    }
}
