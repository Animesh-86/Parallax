package com.parallax.backend.parallax.service.profile;

import com.parallax.backend.parallax.dto.profile.ProfileResponse;
import com.parallax.backend.parallax.dto.profile.PublicProfileResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProfileQueryService {

    private final UserRepository userRepository;

    public ProfileQueryService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PublicProfileResponse getPublicProfile(String identifier) {
        // 1. Try Username
        Optional<User> userOpt = userRepository.findByUsername(identifier);

        // 2. Try Provider ID (e.g. Google sub)
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByProviderId(identifier);
        }

        // 3. Try UUID
        if (userOpt.isEmpty()) {
            try {
                UUID uuid = UUID.fromString(identifier);
                userOpt = userRepository.findById(uuid);
            } catch (IllegalArgumentException ignored) {
            }
        }

        User user = userOpt.orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        return new PublicProfileResponse(
                user.getUsername(),
                user.getFullName(),
                user.getBio(),
                user.getLocation(),
                user.getAvatarUrl(),
                user.getCreatedAt()
        );
    }

    public ProfileResponse getMyProfile(UUID userId){
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ResourceNotFoundException("User Not Found")
        );

        return new  ProfileResponse(
                user.getUsername(),
                user.getFullName(),
                user.getBio(),
                user.getLocation(),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                user.getEmail()
        );
    }
}
