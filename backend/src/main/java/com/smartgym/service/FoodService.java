
package com.smartgym.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.smartgym.entity.Food;
import com.smartgym.repository.FoodRepository;

@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    public Food getFoodById(String id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));
    }

    public Food addFood(Food food) {
        return foodRepository.save(food);
    }

    public Food updateFood(String id, Food food) {
        Food existingFood = getFoodById(id);

        existingFood.setName(food.getName());
        existingFood.setServing(food.getServing());
        existingFood.setCalories(food.getCalories());
        existingFood.setProtein(food.getProtein());
        existingFood.setCarbs(food.getCarbs());
        existingFood.setFat(food.getFat());

        return foodRepository.save(existingFood);
    }

    public void deleteFood(String id) {
        Food food = getFoodById(id);
        foodRepository.delete(food);
    }
}
