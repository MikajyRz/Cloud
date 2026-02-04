package com.cloud.web.config;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AppConfigService {
    
    private final AppConfigRepository appConfigRepository;
    
    public AppConfigService(AppConfigRepository appConfigRepository) {
        this.appConfigRepository = appConfigRepository;
    }
    
    public List<AppConfig> getAllConfigs() {
        return appConfigRepository.findAll();
    }
    
    @Transactional
    public AppConfig updateConfig(String key, String value) {
        AppConfig config = appConfigRepository.findByConfigKey(key)
            .orElseThrow(() -> new IllegalArgumentException("Configuration non trouvée: " + key));
        config.setConfigValue(value);
        return appConfigRepository.save(config);
    }
    
    public String getConfigValue(String key, String defaultValue) {
        return appConfigRepository.findByConfigKey(key)
            .map(AppConfig::getConfigValue)
            .orElse(defaultValue);
    }
    
    public int getConfigValueAsInt(String key, int defaultValue) {
        try {
            String value = getConfigValue(key, String.valueOf(defaultValue));
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
