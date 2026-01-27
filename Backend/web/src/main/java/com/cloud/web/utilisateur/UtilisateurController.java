package com.cloud.web.utilisateur;

import com.cloud.web.utilisateur.dto.UpdateMeRequest;
import com.cloud.web.utilisateur.dto.UtilisateurResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    @GetMapping("/me")
    public UtilisateurResponse getMe(Authentication auth) {
        return utilisateurService.getMe(auth.getName());
    }

    @PutMapping("/me")
    public UtilisateurResponse updateMe(Authentication auth, @RequestBody UpdateMeRequest req) {
        return utilisateurService.updateMe(auth.getName(), req);
    }
}
