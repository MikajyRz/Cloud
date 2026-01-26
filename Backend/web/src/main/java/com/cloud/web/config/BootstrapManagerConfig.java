package com.cloud.web.config;

import com.cloud.web.user.User;
import com.cloud.web.user.UserRepository;
import com.cloud.web.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapManagerConfig {

    @Bean
    public CommandLineRunner bootstrapManager(UserRepository userRepository,
                                             PasswordEncoder passwordEncoder,
                                             @Value("${auth.manager.email}") String managerEmail,
                                             @Value("${auth.manager.password}") String managerPassword) {
        return args -> {
            String email = managerEmail.toLowerCase();
            if (userRepository.existsByEmail(email)) {
                return;
            }
            User u = new User();
            u.setEmail(email);
            u.setNom("Default");
            u.setPrenom("Manager");
            u.setRole(UserRole.MANAGER);
            u.setMotDePasse(passwordEncoder.encode(managerPassword));
            u.setTentativesEchouees(0);
            u.setEstBloque(false);
            userRepository.save(u);
        };
    }
}
