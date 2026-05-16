package com.parallax.backend.parallax.service.profile;

import com.parallax.backend.parallax.dto.profile.UpdateAvatarRequest;
import com.parallax.backend.parallax.dto.profile.UpdateProfileRequest;
import com.parallax.backend.parallax.dto.profile.UpdateUsernameRequest;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfileCommandService {

    private final UserRepository userRepository;
    private final UsernamePolicyService usernamePolicyService;

    public ProfileCommandService(
            UserRepository userRepository,
            UsernamePolicyService usernamePolicyService
    ) {
        this.userRepository = userRepository;
        this.usernamePolicyService = usernamePolicyService;
    }

    // Update profile (safe fields)
    @Transactional
    public void updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getUserOrThrow(userId);

        if (request.getDisplayName() != null) {
            user.setFullName(request.getDisplayName());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }

        userRepository.save(user);
    }


    // Update username (guarded)
    @Transactional
    public void updateUsername(UUID userId, UpdateUsernameRequest request) {
        User user = getUserOrThrow(userId);

        usernamePolicyService.validateUsernameChange(
                request.getUsername(),
                user.getUsername()
        );

        user.setUsername(request.getUsername());
        userRepository.save(user);
    }

    // Update avatar
    @Transactional
    public void updateAvatar(UUID userId, UpdateAvatarRequest request) {
        User user = getUserOrThrow(userId);
        user.setAvatarUrl(request.getAvatarUrl());
        userRepository.save(user);
    }

    // Internal helper
    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );
    }
}
