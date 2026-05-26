package com.parallax.backend.parallax.controller.onboarding;

import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.service.profile.UsernamePolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final UserRepository userRepo;
    private final UsernamePolicyService usernamePolicyService;
    private final JwtUtils jwt;

    public OnboardingController(
            UserRepository userRepo,
            UsernamePolicyService usernamePolicyService,
            JwtUtils jwt
    ) {
        this.userRepo = userRepo;
        this.usernamePolicyService = usernamePolicyService;
        this.jwt = jwt;
    }

    /**
     * Complete onboarding — user picks username and confirms display name.
     * Returns a fresh JWT with onboardingComplete=true.
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeOnboarding(
            @RequestBody OnboardingRequest request,
            Authentication authentication
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Validate username
        String username = request.username().trim().toLowerCase();
        usernamePolicyService.validateUsernameChange(username, user.getUsername());

        // Update user
        user.setUsername(username);
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setFullName(request.displayName().trim());
        }
        user.setOnboardingComplete(true);
        userRepo.save(user);

        // Generate fresh JWT with updated claims
        String newToken = jwt.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                true
        );

        return ResponseEntity.ok(Map.of("accessToken", newToken));
    }

    /**
     * Check if a username is available (for live validation).
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        String normalized = username.trim().toLowerCase();

        if (normalized.length() < 3 || normalized.length() > 30) {
            return ResponseEntity.ok(Map.of("available", false, "reason", "Username must be 3-30 characters"));
        }

        if (!normalized.matches("^[a-z0-9._]+$")) {
            return ResponseEntity.ok(Map.of("available", false, "reason", "Only letters, numbers, dots and underscores"));
        }

        boolean exists = userRepo.existsByUsername(normalized);
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    public record OnboardingRequest(String username, String displayName) {}
}
