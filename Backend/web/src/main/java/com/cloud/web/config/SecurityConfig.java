package com.cloud.web.config;

import com.cloud.web.security.FirebaseAuthFilter;
import com.cloud.web.security.JwtAuthFilter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectProvider<JwtAuthFilter> jwtAuthFilter,
            ObjectProvider<FirebaseAuthFilter> firebaseAuthFilter
    ) throws Exception {
        var chain = http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/login").permitAll()
                        .anyRequest().authenticated()
                );

        JwtAuthFilter jwt = jwtAuthFilter.getIfAvailable();
        if (jwt != null) {
            chain = chain.addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class);
        }

        FirebaseAuthFilter fb = firebaseAuthFilter.getIfAvailable();
        if (fb != null) {
            chain = chain.addFilterBefore(fb, UsernamePasswordAuthenticationFilter.class);
        }

        return chain.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
