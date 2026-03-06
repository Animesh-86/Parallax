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

    public PublicProfileResponse getPublicProfile(String username){
        User user = userRepository.findByUsername(username)
                .orElseThrow(()-> new ResourceNotFoundException("User Not Found"));

        return new  PublicProfileResponse(
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
