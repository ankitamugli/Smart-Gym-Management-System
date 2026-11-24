package com.smartgym.dto;


import java.time.LocalDate;
import java.util.List;

public class DailyDietSummary {

	private LocalDate date;
    private int totalMeals;
    private double totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFats;
    private List<MealResponse> meals;

    public DailyDietSummary(LocalDate date, int totalMeals, double totalCalories,
                            double totalProtein, double totalCarbs, double totalFats,
                            List<MealResponse> meals) {
        this.date = date;
        this.totalMeals = totalMeals;
        this.totalCalories = totalCalories;
        this.totalProtein = totalProtein;
        this.totalCarbs = totalCarbs;
        this.totalFats = totalFats;
        this.meals = meals;
    }

    public LocalDate getDate() { return date; }
    public int getTotalMeals() { return totalMeals; }
    public double getTotalCalories() { return totalCalories; }
    public double getTotalProtein() { return totalProtein; }
    public double getTotalCarbs() { return totalCarbs; }
    public double getTotalFats() { return totalFats; }
    public List<MealResponse> getMeals() { return meals; }
}
