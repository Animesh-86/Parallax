package com.parallax.backend.parallax.service.profile;

import com.parallax.backend.parallax.dto.profile.ProfileResponse;
import com.parallax.backend.parallax.dto.profile.PublicProfileResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.dto.profile.GamificationDtos;
import com.parallax.backend.parallax.entity.gamification.DailyContribution;
import com.parallax.backend.parallax.entity.gamification.RecentActivity;
import com.parallax.backend.parallax.entity.gamification.UserBadge;
import com.parallax.backend.parallax.entity.gamification.UserStats;
import com.parallax.backend.parallax.repository.gamification.DailyContributionRepository;
import com.parallax.backend.parallax.repository.gamification.RecentActivityRepository;
import com.parallax.backend.parallax.repository.gamification.UserBadgeRepository;
import com.parallax.backend.parallax.repository.gamification.UserStatsRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProfileQueryService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final RecentActivityRepository recentActivityRepository;
    private final DailyContributionRepository dailyContributionRepository;
    private final ProjectRepository projectRepository;

    public ProfileQueryService(UserRepository userRepository,
                               UserStatsRepository userStatsRepository,
                               UserBadgeRepository userBadgeRepository,
                               RecentActivityRepository recentActivityRepository,
                               DailyContributionRepository dailyContributionRepository,
                               ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.userStatsRepository = userStatsRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.recentActivityRepository = recentActivityRepository;
        this.dailyContributionRepository = dailyContributionRepository;
        this.projectRepository = projectRepository;
    }

    public PublicProfileResponse getPublicProfile(String identifier) {
        User user = findUserByIdentifier(identifier);
        return buildProfileResponse(user, false);
    }

    public ProfileResponse getMyProfile(UUID userId){
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ResourceNotFoundException("User Not Found")
        );
        return (ProfileResponse) buildProfileResponse(user, true);
    }

    private User findUserByIdentifier(String identifier) {
        Optional<User> userOpt = userRepository.findByUsername(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByProviderId(identifier);
        }
        if (userOpt.isEmpty()) {
            try {
                UUID uuid = UUID.fromString(identifier);
                userOpt = userRepository.findById(uuid);
            } catch (IllegalArgumentException ignored) {}
        }
        return userOpt.orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private PublicProfileResponse buildProfileResponse(User user, boolean isPrivate) {
        UUID userId = user.getId();

        // Fetch Gamification Data
        UserStats stats = userStatsRepository.findById(userId).orElse(new UserStats(userId));
        int projectCount = projectRepository.findByOwner_IdOrderByCreatedAtDesc(userId).size(); // Approximate
        
        GamificationDtos.ProfileStatsDto statsDto = new GamificationDtos.ProfileStatsDto(
                projectCount,
                stats.getRoomsJoined(),
                stats.getTotalContributions(),
                stats.getCurrentStreak(),
                stats.getLongestStreak()
        );

        List<GamificationDtos.BadgeDto> badges = userBadgeRepository.findByUserIdOrderByAwardedAtDesc(userId)
                .stream().map(b -> new GamificationDtos.BadgeDto(
                        b.getId().toString(), b.getBadgeType(), b.getBadgeType().getDisplayName(),
                        b.getBadgeType().getDescription(), b.getBadgeType().getIconUrl(),
                        b.getBadgeType().getTier(), b.getAwardedAt()
                )).collect(Collectors.toList());

        List<GamificationDtos.ActivityDto> activities = recentActivityRepository.findTop20ByUserIdOrderByTimestampDesc(userId)
                .stream().map(a -> new GamificationDtos.ActivityDto(
                        a.getId().toString(), a.getActivityType(), a.getDescription(), a.getTimestamp()
                )).collect(Collectors.toList());

        List<GamificationDtos.DailyContributionDto> graph = dailyContributionRepository.findByUserIdOrderByDateAsc(userId)
                .stream().map(c -> new GamificationDtos.DailyContributionDto(
                        c.getDate().toString(), c.getCount()
                )).collect(Collectors.toList());

        PublicProfileResponse response;
        if (isPrivate) {
            response = new ProfileResponse(
                    user.getUsername(), user.getFullName(), user.getBio(),
                    user.getLocation(), user.getAvatarUrl(), user.getCreatedAt(), user.getEmail()
            );
        } else {
            response = new PublicProfileResponse(
                    user.getUsername(), user.getFullName(), user.getBio(),
                    user.getLocation(), user.getAvatarUrl(), user.getCreatedAt(), null, null, null, null
            );
        }

        response.setStats(statsDto);
        response.setBadges(badges);
        response.setRecentActivity(activities);
        response.setContributionGraph(graph);

        return response;
    }
}
