package com.cloud.web.security;

import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.cloud.web.user.UserRole;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@ConditionalOnProperty(name = "auth.mode", havingValue = "online")
public class FirebaseAuthFilter extends OncePerRequestFilter {

    private static final String FIREBASE_PLACEHOLDER_PASSWORD = "{firebase}";

    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;

    public FirebaseAuthFilter(FirebaseAuth firebaseAuth, UserRepository userRepository) {
        this.firebaseAuth = firebaseAuth;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring("Bearer ".length()).trim();

        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(token);

            String email = decoded.getEmail();
            if (email == null || email.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }

            String normalizedEmail = email.toLowerCase();

            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseGet(() -> provisionUser(normalizedEmail));

            if (user.isLockedNow()) {
                filterChain.doFilter(request, response);
                return;
            }

            var auth = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private User provisionUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setMotDePasse(FIREBASE_PLACEHOLDER_PASSWORD);
        user.setNom(null);
        user.setPrenom(null);
        user.setRole(UserRole.UTILISATEUR);
        user.setTentativesEchouees(0);
        user.setEstBloque(false);
        return userRepository.save(user);
    }
}
