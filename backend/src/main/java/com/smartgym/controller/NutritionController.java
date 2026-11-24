
package com.smartgym.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.entity.Nutrition;
import com.smartgym.service.NutritionService;

@RestController
@RequestMapping("/api/nutrition")
@CrossOrigin(origins = "*")
public class NutritionController {

    private final NutritionService service;

    public NutritionController(NutritionService service) {
        this.service = service;
    }

    // ADD MEAL
    @PostMapping
    public ResponseEntity<Nutrition> addMeal(
            @RequestBody Nutrition nutrition) {

        return ResponseEntity.ok(service.addMeal(nutrition));
    }

    // GET MEALS BY DATE
    @GetMapping
    public ResponseEntity<List<Nutrition>> getMeals(
            @RequestParam(required = false) LocalDate date) {

        if (date == null) {
            date = LocalDate.now();
        }

        return ResponseEntity.ok(service.getMeals(date));
    }

    // UPDATE MEAL
    @PutMapping("/{id}")
    public ResponseEntity<Nutrition> updateMeal(
            @PathVariable Long id,
            @RequestBody Nutrition nutrition) {

        return ResponseEntity.ok(
                service.updateMeal(id, nutrition)
        );
    }

    // DELETE MEAL
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMeal(
            @PathVariable Long id) {

        service.deleteMeal(id);

        return ResponseEntity.ok("Meal deleted successfully");
    }
}
