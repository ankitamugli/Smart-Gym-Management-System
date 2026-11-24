
package com.smartgym.dto;

import java.time.LocalDate;

public class ChallengeResponse {

    private Long id;
    private String title;
    private String description;
    private String challengeType;
    private Integer targetValue;
    private Integer durationInDays;
    private Integer rewardPoints;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;

    public ChallengeResponse(Long id, String title,
            String description, String challengeType,
            Integer targetValue, Integer durationInDays,
            Integer rewardPoints, LocalDate startDate,
            LocalDate endDate, Boolean active) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.challengeType = challengeType;
        this.targetValue = targetValue;
        this.durationInDays = durationInDays;
        this.rewardPoints = rewardPoints;
        this.startDate = startDate;
        this.endDate = endDate;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getChallengeType() { return challengeType; }
    public Integer getTargetValue() { return targetValue; }
    public Integer getDurationInDays() { return durationInDays; }
    public Integer getRewardPoints() { return rewardPoints; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public Boolean getActive() { return active; }
}
