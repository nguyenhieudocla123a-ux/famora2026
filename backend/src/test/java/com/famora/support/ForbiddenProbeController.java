package com.famora.support;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only endpoint guarded by an authority no user has. It proves that a signed-in user who lacks a
 * right gets 403 in the app's error shape; real family roles arrive in Phase 4.
 */
@RestController
class ForbiddenProbeController {

    @GetMapping("/api/test/admin-only")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    String adminOnly() {
        return "ok";
    }
}
