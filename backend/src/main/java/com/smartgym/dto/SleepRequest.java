package com.smartgym.dto;


import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public class SleepRequest {
	
	@NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Sleep date is required")
    @PastOrPresent(message = "Sleep date cannot be in the future")
    private LocalDate sleepDate;

    @NotNull(message = "Sleep hours are required")
    @DecimalMin(value = "0.1", message = "Sleep hours must be greater than 0")
    @DecimalMax(value = "24.0", message = "Sleep hours cannot exceed 24")
    private Double sleepHours;

    @NotNull(message = "Sleep quality is required")
    @Pattern(
        regexp = "POOR|AVERAGE|GOOD|EXCELLENT",
        message = "Quality must be POOR, AVERAGE, GOOD or EXCELLENT"
    )
    private String sleepQuality;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getSleepDate() {
        return sleepDate;
    }

    public void setSleepDate(LocalDate sleepDate) {
        this.sleepDate = sleepDate;
    }

    public Double getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(Double sleepHours) {
        this.sleepHours = sleepHours;
    }

    public String getSleepQuality() {
        return sleepQuality;
    }

    public void setSleepQuality(String sleepQuality) {
        this.sleepQuality = sleepQuality;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
