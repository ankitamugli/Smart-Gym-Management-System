
package com.smartgym.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartgym.entity.Nutrition;
import com.smartgym.repository.NutritionRepository;

@Service
public class NutritionService {

    private final NutritionRepository repository;

    public NutritionService(NutritionRepository repository) {
        this.repository = repository;
    }

    // ADD MEAL
    public Nutrition addMeal(Nutrition nutrition) {
        if (nutrition.getMealDate() == null) {
            nutrition.setMealDate(LocalDate.now());
        }

        return repository.save(nutrition);
    }

    // GET MEALS BY DATE
    public List<Nutrition> getMeals(LocalDate date) {
        return repository.findByMealDate(date);
    }

    // UPDATE MEAL
    public Nutrition updateMeal(Long id, Nutrition updatedNutrition) {

        Nutrition existing = repository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Nutrition record not found: " + id)
                );

        existing.setMealName(updatedNutrition.getMealName());
        existing.setFoodName(updatedNutrition.getFoodName());
        existing.setCalories(updatedNutrition.getCalories());
        existing.setProtein(updatedNutrition.getProtein());
        existing.setCarbs(updatedNutrition.getCarbs());
        existing.setFat(updatedNutrition.getFat());
        existing.setWaterMl(updatedNutrition.getWaterMl());

        if (updatedNutrition.getMealDate() != null) {
            existing.setMealDate(updatedNutrition.getMealDate());
        }

        return repository.save(existing);
    }

    // DELETE MEAL
    public void deleteMeal(Long id) {

        if (!repository.existsById(id)) {
            throw new RuntimeException("Nutrition record not found: " + id);
        }

        repository.deleteById(id);
    }
}
