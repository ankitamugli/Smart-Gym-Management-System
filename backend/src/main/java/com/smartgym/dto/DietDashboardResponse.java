
package com.smartgym.dto;

import java.time.LocalDate;

public class DietDashboardResponse {

    private Long userId;
    private LocalDate date;

    private double calorieGoal;
    private double consumedCalories;
    private double remainingCalories;
    private double calorieCompletionPercentage;

    private double proteinGoal;
    private double consumedProtein;
    private double remainingProtein;

    private double carbsGoal;
    private double consumedCarbs;
    private double remainingCarbs;

    private double fatsGoal;
    private double consumedFats;
    private double remainingFats;

    public DietDashboardResponse(
            Long userId,
            LocalDate date,
            double calorieGoal,
            double consumedCalories,
            double remainingCalories,
            double calorieCompletionPercentage,
            double proteinGoal,
            double consumedProtein,
            double remainingProtein,
            double carbsGoal,
            double consumedCarbs,
            double remainingCarbs,
            double fatsGoal,
            double consumedFats,
            double remainingFats) {

        this.userId = userId;
        this.date = date;

        this.calorieGoal = calorieGoal;
        this.consumedCalories = consumedCalories;
        this.remainingCalories = remainingCalories;
        this.calorieCompletionPercentage = calorieCompletionPercentage;

        this.proteinGoal = proteinGoal;
        this.consumedProtein = consumedProtein;
        this.remainingProtein = remainingProtein;

        this.carbsGoal = carbsGoal;
        this.consumedCarbs = consumedCarbs;
        this.remainingCarbs = remainingCarbs;

        this.fatsGoal = fatsGoal;
        this.consumedFats = consumedFats;
        this.remainingFats = remainingFats;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public double getCalorieGoal() {
        return calorieGoal;
    }

    public double getConsumedCalories() {
        return consumedCalories;
    }

    public double getRemainingCalories() {
        return remainingCalories;
    }

    public double getCalorieCompletionPercentage() {
        return calorieCompletionPercentage;
    }

    public double getProteinGoal() {
        return proteinGoal;
    }

    public double getConsumedProtein() {
        return consumedProtein;
    }

    public double getRemainingProtein() {
        return remainingProtein;
    }

    public double getCarbsGoal() {
        return carbsGoal;
    }

    public double getConsumedCarbs() {
        return consumedCarbs;
    }

    public double getRemainingCarbs() {
        return remainingCarbs;
    }

    public double getFatsGoal() {
        return fatsGoal;
    }

    public double getConsumedFats() {
        return consumedFats;
    }

    public double getRemainingFats() {
        return remainingFats;
    }
}
