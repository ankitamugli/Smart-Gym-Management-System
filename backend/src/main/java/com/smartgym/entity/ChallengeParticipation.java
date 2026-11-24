
package com.smartgym.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(
    name = "challenge_participations",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"challenge_id", "user_id"}
    )
)
public class ChallengeParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "challenge_id", nullable = false)
    private FitnessChallenge challenge;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer progressValue = 0;

    private Integer rewardPointsEarned = 0;

    private String status = "JOINED";

    private LocalDateTime joinedAt;

    private LocalDateTime completedAt;

    public ChallengeParticipation() {
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public FitnessChallenge getChallenge() {
        return challenge;
    }

    public void setChallenge(FitnessChallenge challenge) {
        this.challenge = challenge;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getProgressValue() {
        return progressValue;
    }

    public void setProgressValue(Integer progressValue) {
        this.progressValue = progressValue;
    }

    public Integer getRewardPointsEarned() {
        return rewardPointsEarned;
    }

    public void setRewardPointsEarned(Integer rewardPointsEarned) {
        this.rewardPointsEarned = rewardPointsEarned;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
