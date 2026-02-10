package com.cloud.web.manager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    @Autowired
    private ManagerService managerService;

    @GetMapping("/budget")
    public ResponseEntity<BigDecimal> getBudget(@RequestParam Long niveauId, @RequestParam BigDecimal surfaceM2) {
        BigDecimal budget = managerService.calculerBudget(niveauId, surfaceM2);
        return ResponseEntity.ok(budget);
    }
}
