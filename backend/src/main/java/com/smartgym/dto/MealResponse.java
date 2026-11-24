package com.smartgym.dto;


import java.time.LocalDate;

public class MealResponse {
	
	 private Long id;
	    private Long userId;
	    private String mealName;
	    private String mealType;
	    private Double calories;
	    private Double protein;
	    private Double carbs;
	    private Double fats;
	    private LocalDate mealDate;

	    public MealResponse(Long id, Long userId, String mealName, String mealType,
	                        Double calories, Double protein, Double carbs, Double fats, LocalDate mealDate) {
	        this.id = id;
	        this.userId = userId;
	        this.mealName = mealName;
	        this.mealType = mealType;
	        this.calories = calories;
	        this.protein = protein;
	        this.carbs = carbs;
	        this.fats = fats;
	        this.mealDate = mealDate;
	    }

	    public Long getId() { return id; }
	    public Long getUserId() { return userId; }
	    public String getMealName() { return mealName; }
	    public String getMealType() { return mealType; }
	    public Double getCalories() { return calories; }
	    public Double getProtein() { return protein; }
	    public Double getCarbs() { return carbs; }
	    public Double getFats() { return fats; }
	    public LocalDate getMealDate() { return mealDate; }

}
