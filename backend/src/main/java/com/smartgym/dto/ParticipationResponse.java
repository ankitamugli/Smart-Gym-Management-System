
package com.smartgym.dto;

import java.time.LocalDateTime;

public class ParticipationResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long challengeId;
    private String challengeTitle;
    private Integer targetValue;
    private Integer progressValue;
    private Integer rewardPointsEarned;
    private String status;
    private LocalDateTime joinedAt;
    private LocalDateTime completedAt;

    public ParticipationResponse(Long id, Long userId,
            String userName, Long challengeId,
            String challengeTitle, Integer targetValue,
            Integer progressValue, Integer rewardPointsEarned,
            String status, LocalDateTime joinedAt,
            LocalDateTime completedAt) {

        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.challengeId = challengeId;
        this.challengeTitle = challengeTitle;
        this.targetValue = targetValue;
        this.progressValue = progressValue;
        this.rewardPointsEarned = rewardPointsEarned;
        this.status = status;
        this.joinedAt = joinedAt;
        this.completedAt = completedAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Long getChallengeId() { return challengeId; }
    public String getChallengeTitle() { return challengeTitle; }
    public Integer getTargetValue() { return targetValue; }
    public Integer getProgressValue() { return progressValue; }
    public Integer getRewardPointsEarned() { return rewardPointsEarned; }
    public String getStatus() { return status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
