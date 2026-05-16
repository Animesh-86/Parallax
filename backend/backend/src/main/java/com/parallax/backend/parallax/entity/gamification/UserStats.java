package com.parallax.backend.parallax.entity.gamification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_stats")
public class UserStats {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "current_streak", nullable = false)
    private int currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private int longestStreak = 0;

    @Column(name = "total_contributions", nullable = false)
    private int totalContributions = 0;

    @Column(name = "rooms_joined", nullable = false)
    private int roomsJoined = 0;

    @Column(name = "last_activity_date")
    private Instant lastActivityDate;

    protected UserStats() {}

    public UserStats(UUID userId) {
        this.userId = userId;
    }

    public UUID getUserId() { return userId; }
    public int getCurrentStreak() { return currentStreak; }
    public int getLongestStreak() { return longestStreak; }
    public int getTotalContributions() { return totalContributions; }
    public int getRoomsJoined() { return roomsJoined; }
    public Instant getLastActivityDate() { return lastActivityDate; }

    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
    public void setLongestStreak(int longestStreak) { this.longestStreak = longestStreak; }
    public void setTotalContributions(int totalContributions) { this.totalContributions = totalContributions; }
    public void setRoomsJoined(int roomsJoined) { this.roomsJoined = roomsJoined; }
    public void setLastActivityDate(Instant lastActivityDate) { this.lastActivityDate = lastActivityDate; }
}
