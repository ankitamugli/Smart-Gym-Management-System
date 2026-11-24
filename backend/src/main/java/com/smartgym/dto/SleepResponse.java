
package com.smartgym.dto;


import java.time.LocalDate;

public class SleepResponse {
	

    private Long id;
    private Long userId;
    private String userName;
    private LocalDate sleepDate;
    private Double sleepHours;
    private String sleepQuality;
    private String notes;

    public SleepResponse(Long id, Long userId, String userName,
                         LocalDate sleepDate, Double sleepHours,
                         String sleepQuality, String notes) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.sleepDate = sleepDate;
        this.sleepHours = sleepHours;
        this.sleepQuality = sleepQuality;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public LocalDate getSleepDate() {
        return sleepDate;
    }

    public Double getSleepHours() {
        return sleepHours;
    }

    public String getSleepQuality() {
        return sleepQuality;
    }

    public String getNotes() {
        return notes;
    }

}
