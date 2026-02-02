package com.cloud.web.user;

import com.cloud.web.user.dto.LockedUserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerLockedUsersController {

    private final UserRepository userRepository;

    public ManagerLockedUsersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/locked-users")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<LockedUserResponse>> lockedUsers() {
        var rows = userRepository.findByEstBloqueTrue()
                .stream()
                .map(u -> new LockedUserResponse(
                        u.getEmail(),
                        u.getNom(),
                        u.getPrenom(),
                        u.getRole(),
                        u.getTentativesEchouees()
                ))
                .toList();

        return ResponseEntity.ok(rows);
    }
}
