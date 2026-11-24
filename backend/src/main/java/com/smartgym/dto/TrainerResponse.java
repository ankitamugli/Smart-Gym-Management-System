
package com.smartgym.dto;

public class TrainerResponse {

    private Long id;
    private Long userId;
    private String trainerName;
    private String specialization;
    private Integer experienceYears;
    private String supportedGoals;
    private Double hourlyRate;
    private String bio;
    private Boolean available;
    private Boolean active;

    public TrainerResponse(Long id, Long userId, String trainerName,
            String specialization, Integer experienceYears,
            String supportedGoals, Double hourlyRate, String bio,
            Boolean available, Boolean active) {

        this.id = id;
        this.userId = userId;
        this.trainerName = trainerName;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.supportedGoals = supportedGoals;
        this.hourlyRate = hourlyRate;
        this.bio = bio;
        this.available = available;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public String getSupportedGoals() {
        return supportedGoals;
    }

    public Double getHourlyRate() {
        return hourlyRate;
    }

    public String getBio() {
        return bio;
    }

    public Boolean getAvailable() {
        return available;
    }

    public Boolean getActive() {
        return active;
    }
}
