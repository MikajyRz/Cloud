package com.cloud.web.config;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class AppConfigController {
    
    private final AppConfigService appConfigService;
    
    public AppConfigController(AppConfigService appConfigService) {
        this.appConfigService = appConfigService;
    }
    
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<AppConfig>> getAllConfigs() {
        return ResponseEntity.ok(appConfigService.getAllConfigs());
    }
    
    @PutMapping("/{key}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AppConfig> updateConfig(
        @PathVariable String key,
        @RequestBody Map<String, String> body
    ) {
        String value = body.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().build();
        }
        AppConfig updated = appConfigService.updateConfig(key, value);
        return ResponseEntity.ok(updated);
    }
}
