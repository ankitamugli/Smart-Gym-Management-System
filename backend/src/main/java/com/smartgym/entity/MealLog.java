package com.smartgym.entity;


import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "meal_logs")
public class MealLog {
	
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @ManyToOne
	    @JoinColumn(name = "user_id", nullable = false)
	    private User user;

	    @Column(nullable = false)
	    private String mealName;

	    @Column(nullable = false)
	    private String mealType; // BREAKFAST / LUNCH / DINNER / SNACK

	    @Column(nullable = false)
	    private Double calories;

	    private Double protein = 0.0;
	    private Double carbs = 0.0;
	    private Double fats = 0.0;

	    @Column(nullable = false)
	    private LocalDate mealDate;

	    public MealLog() {
	    }

	    public Long getId() {
	    	return id; 
	    	}
	    public void setId(Long id) {
	    	this.id = id; 
	    	}

	    public User getUser() {
	    	return user; 
	    	}
	    public void setUser(User user) { 
	    	this.user = user; 
	    	}

	    public String getMealName() { 
	    	return mealName; 
	    	}
	    public void setMealName(String mealName) {
	    	this.mealName = mealName; 
	    	}

	    public String getMealType() {
	    	return mealType;
	    	}
	    public void setMealType(String mealType) { 
	    	this.mealType = mealType;
	    	}

	    public Double getCalories() { 
	    	return calories;
	    	}
	    public void setCalories(Double calories) { 
	    	this.calories = calories; 
	    	}

	    public Double getProtein() {
	    	return protein; 
	    	}
	    
	    public void setProtein(Double protein) { 
	    	this.protein = protein;
	    	}

	    public Double getCarbs() {
	    	return carbs;
	    	}
	    public void setCarbs(Double carbs) {
	    	this.carbs = carbs;
	    	}
	    

	    public Double getFats() { 
	    	return fats; 
	    	}
	    public void setFats(Double fats) { 
	    	this.fats = fats; 
	    	}

	    public LocalDate getMealDate() {
	    	return mealDate; 
	    	}
	    public void setMealDate(LocalDate mealDate) {
	    	this.mealDate = mealDate; 
	    	}

}
