package com.cloud.web.config;

import com.cloud.web.utilisateur.Utilisateur;
import com.cloud.web.utilisateur.UtilisateurRepository;
import com.cloud.web.utilisateur.RoleUtilisateur;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapManagerConfig {

    @Bean
    public CommandLineRunner bootstrapManager(UtilisateurRepository utilisateurRepository,
                                             PasswordEncoder passwordEncoder,
                                             @Value("${auth.manager.email}") String managerEmail,
                                             @Value("${auth.manager.password}") String managerPassword) {
        return args -> {
            String email = managerEmail.toLowerCase();
            if (utilisateurRepository.existsByEmail(email)) {
                return;
            }
            Utilisateur u = new Utilisateur();
            u.setEmail(email);
            u.setNomComplet("Default Manager");
            u.setRole(RoleUtilisateur.MANAGER);
            u.setMotDePasse(passwordEncoder.encode(managerPassword));
            u.setTentativesEchouees(0);
            u.setEstBloque(false);
            utilisateurRepository.save(u);
        };
    }
}
