package com.parallax.backend.parallax.entity.gamification;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_contributions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "contribution_date"})
})
public class DailyContribution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "contribution_date", nullable = false)
    private LocalDate date;

    @Column(name = "contribution_count", nullable = false)
    private int count = 0;

    protected DailyContribution() {}

    public DailyContribution(UUID userId, LocalDate date) {
        this.userId = userId;
        this.date = date;
        this.count = 0;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public LocalDate getDate() { return date; }
    public int getCount() { return count; }

    public void incrementCount() {
        this.count++;
    }
}
