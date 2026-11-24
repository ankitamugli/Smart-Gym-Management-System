
package com.smartgym.dto;

public class DietGoalResponse {

    private Long id;
    private Long userId;
    private Double calorieGoal;
    private Double proteinGoal;
    private Double carbsGoal;
    private Double fatsGoal;
    private Integer cupMl;

    public DietGoalResponse(
            Long id,
            Long userId,
            Double calorieGoal,
            Double proteinGoal,
            Double carbsGoal,
            Double fatsGoal,
            Integer cupMl) {

        this.id = id;
        this.userId = userId;
        this.calorieGoal = calorieGoal;
        this.proteinGoal = proteinGoal;
        this.carbsGoal = carbsGoal;
        this.fatsGoal = fatsGoal;
        this.cupMl = cupMl;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Double getCalorieGoal() {
        return calorieGoal;
    }

    public Double getProteinGoal() {
        return proteinGoal;
    }

    public Double getCarbsGoal() {
        return carbsGoal;
    }

    public Double getFatsGoal() {
        return fatsGoal;
    }

    public Integer getCupMl() {
        return cupMl;
    }
}
