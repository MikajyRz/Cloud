package com.cloud.web.security;

import com.cloud.web.auth.AuthSessionRepository;
import com.cloud.web.utilisateur.UtilisateurRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthSessionRepository authSessionRepository;
    private final UtilisateurRepository utilisateurRepository;

    public JwtAuthFilter(JwtService jwtService, AuthSessionRepository authSessionRepository, UtilisateurRepository utilisateurRepository) {
        this.jwtService = jwtService;
        this.authSessionRepository = authSessionRepository;
        this.utilisateurRepository = utilisateurRepository;
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
            JwtPayload payload = jwtService.parseAndValidate(token);

            var sessionOpt = authSessionRepository.findByToken(token);
            if (sessionOpt.isEmpty() || sessionOpt.get().getDateExpiration().isBefore(java.time.LocalDateTime.now())) {
                filterChain.doFilter(request, response);
                return;
            }

            var userOpt = utilisateurRepository.findByEmail(payload.subject());
            if (userOpt.isEmpty()) {
                filterChain.doFilter(request, response);
                return;
            }

            var utilisateur = userOpt.get();
            var auth = new UsernamePasswordAuthenticationToken(
                    utilisateur.getEmail(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name()))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
