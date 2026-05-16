package com.parallax.backend.parallax.controller.profile;

import com.parallax.backend.parallax.dto.profile.*;
import com.parallax.backend.parallax.security.AuthUtil;
import com.parallax.backend.parallax.service.profile.FileStorageService;
import com.parallax.backend.parallax.service.profile.ProfileCommandService;
import com.parallax.backend.parallax.service.profile.ProfileQueryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileQueryService profileQueryService;
    private final ProfileCommandService profileCommandService;
    private final FileStorageService fileStorageService;

    public ProfileController(
            ProfileQueryService profileQueryService,
            ProfileCommandService profileCommandService,
            FileStorageService fileStorageService
    ) {
        this.profileQueryService = profileQueryService;
        this.profileCommandService = profileCommandService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Public profile by username
     * Accessible without authentication
     */
    @GetMapping("/{username}")
    public ResponseEntity<PublicProfileResponse> getPublicProfile(
            @PathVariable String username
    ) {
        return ResponseEntity.ok(
                profileQueryService.getPublicProfile(username)
        );
    }

    /**
     * Private profile (self)
     * Requires authentication
     */
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile() {
        UUID userId = AuthUtil.getCurrentUserId();
        return ResponseEntity.ok(
                profileQueryService.getMyProfile(userId)
        );
    }

    /**
     * Update display name, bio, location
     */
    @PutMapping("/me")
    public ResponseEntity<Void> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UUID userId = AuthUtil.getCurrentUserId();
        profileCommandService.updateProfile(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update username (guarded, policy-driven)
     */
    @PutMapping("/me/username")
    public ResponseEntity<Void> updateUsername(
            @Valid @RequestBody UpdateUsernameRequest request
    ) {
        UUID userId = AuthUtil.getCurrentUserId();
        profileCommandService.updateUsername(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update avatar reference
     */
    @PutMapping("/me/avatar")
    public ResponseEntity<Void> updateAvatar(
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        UUID userId = AuthUtil.getCurrentUserId();
        profileCommandService.updateAvatar(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload avatar file
     */
    @PostMapping("/me/avatar/upload")
    public ResponseEntity<ProfileResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file
    ) {
        UUID userId = AuthUtil.getCurrentUserId();
        String fileUrl = fileStorageService.storeFile(file);
        
        UpdateAvatarRequest request = new UpdateAvatarRequest();
        request.setAvatarUrl(fileUrl);
        profileCommandService.updateAvatar(userId, request);
        
        return ResponseEntity.ok(profileQueryService.getMyProfile(userId));
    }
}
