
package com.smartgym.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartgym.entity.Food;
import com.smartgym.service.FoodService;

@RestController
@RequestMapping("/foods")
@CrossOrigin(origins = "*")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    // Get all foods
    @GetMapping
    public ResponseEntity<List<Food>> getAllFoods() {
        return ResponseEntity.ok(foodService.getAllFoods());
    }

    // Get food by ID
    @GetMapping("/{id}")
    public ResponseEntity<Food> getFoodById(@PathVariable String id) {
        return ResponseEntity.ok(foodService.getFoodById(id));
    }

    // Add food
    @PostMapping
    public ResponseEntity<Food> addFood(@RequestBody Food food) {
        return ResponseEntity.ok(foodService.addFood(food));
    }

    // Update food
    @PutMapping("/{id}")
    public ResponseEntity<Food> updateFood(
            @PathVariable String id,
            @RequestBody Food food) {

        return ResponseEntity.ok(foodService.updateFood(id, food));
    }

    // Delete food
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFood(@PathVariable String id) {
        foodService.deleteFood(id);
        return ResponseEntity.ok("Food deleted successfully");
    }
}
