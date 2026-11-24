
package com.smartgym.dto;

public class LeaderboardResponse {

    private Integer rank;
    private Long userId;
    private String userName;
    private Integer progressValue;
    private Integer rewardPointsEarned;
    private String status;

    public LeaderboardResponse(Integer rank, Long userId,
            String userName, Integer progressValue,
            Integer rewardPointsEarned, String status) {

        this.rank = rank;
        this.userId = userId;
        this.userName = userName;
        this.progressValue = progressValue;
        this.rewardPointsEarned = rewardPointsEarned;
        this.status = status;
    }

    public Integer getRank() { return rank; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Integer getProgressValue() { return progressValue; }
    public Integer getRewardPointsEarned() { return rewardPointsEarned; }
    public String getStatus() { return status; }
}
