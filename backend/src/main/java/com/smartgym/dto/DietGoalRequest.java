
package com.smartgym.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class DietGoalRequest {

    @NotNull
    private Long userId;

    @NotNull
    @Positive
    private Double calorieGoal;

    @Positive
    private Double proteinGoal = 100.0;

    @Positive
    private Double carbsGoal = 250.0;

    @Positive
    private Double fatsGoal = 65.0;

    @NotNull
    @Positive
    private Integer cupMl = 250;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Double getCalorieGoal() {
        return calorieGoal;
    }

    public void setCalorieGoal(Double calorieGoal) {
        this.calorieGoal = calorieGoal;
    }

    public Double getProteinGoal() {
        return proteinGoal;
    }

    public void setProteinGoal(Double proteinGoal) {
        this.proteinGoal = proteinGoal;
    }

    public Double getCarbsGoal() {
        return carbsGoal;
    }

    public void setCarbsGoal(Double carbsGoal) {
        this.carbsGoal = carbsGoal;
    }

    public Double getFatsGoal() {
        return fatsGoal;
    }

    public void setFatsGoal(Double fatsGoal) {
        this.fatsGoal = fatsGoal;
    }

    public Integer getCupMl() {
        return cupMl;
    }

    public void setCupMl(Integer cupMl) {
        this.cupMl = cupMl;
    }
}
