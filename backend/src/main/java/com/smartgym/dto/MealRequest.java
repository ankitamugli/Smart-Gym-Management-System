package com.smartgym.dto;


import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
public class MealRequest {
	
	  @NotNull(message = "User id is required")
	    private Long userId;

	    @NotBlank(message = "Meal name is required")
	    private String mealName;

	    @NotBlank(message = "Meal type is required")
	    @Pattern(regexp = "BREAKFAST|LUNCH|DINNER|SNACK",
	             message = "Meal type must be BREAKFAST, LUNCH, DINNER or SNACK")
	    private String mealType;

	    @NotNull(message = "Calories is required")
	    @PositiveOrZero(message = "Calories cannot be negative")
	    private Double calories;

	    @PositiveOrZero(message = "Protein cannot be negative")
	    private Double protein;

	    @PositiveOrZero(message = "Carbs cannot be negative")
	    private Double carbs;

	    @PositiveOrZero(message = "Fats cannot be negative")
	    private Double fats;

	    private LocalDate mealDate; // nahi diya to aaj ki date

	    public Long getUserId() { return userId; }
	    public void setUserId(Long userId) { this.userId = userId; }

	    public String getMealName() { return mealName; }
	    public void setMealName(String mealName) { this.mealName = mealName; }

	    public String getMealType() { return mealType; }
	    public void setMealType(String mealType) { this.mealType = mealType; }

	    public Double getCalories() { return calories; }
	    public void setCalories(Double calories) { this.calories = calories; }

	    public Double getProtein() { return protein; }
	    public void setProtein(Double protein) { this.protein = protein; }

	    public Double getCarbs() { return carbs; }
	    public void setCarbs(Double carbs) { this.carbs = carbs; }

	    public Double getFats() { return fats; }
	    public void setFats(Double fats) { this.fats = fats; }

	    public LocalDate getMealDate() { return mealDate; }
	    public void setMealDate(LocalDate mealDate) { this.mealDate = mealDate; }

}
