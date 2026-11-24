
package com.smartgym.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.DailyDietSummary;
import com.smartgym.dto.MealRequest;
import com.smartgym.dto.MealResponse;
import com.smartgym.dto.DietGoalRequest;
import com.smartgym.dto.DietGoalResponse;
import com.smartgym.dto.DietDashboardResponse;

import com.smartgym.response.ApiResponse;
import com.smartgym.service.DietService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/diet")
@CrossOrigin(origins = "*")
public class DietController {

    @Autowired
    private DietService dietService;

    // Log Meal
    @PostMapping("/log")
    public ResponseEntity<ApiResponse<MealResponse>> logMeal(
            @Valid @RequestBody MealRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Meal logged successfully 🥗",
                        dietService.logMeal(request)));
    }

    // Get Today's Diet Summary
    @GetMapping("/user/{userId}/today")
    public ResponseEntity<ApiResponse<DailyDietSummary>> getToday(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Today's diet summary",
                        dietService.getDaySummary(userId, null)));
    }

    // Get Diet Summary By Date
    @GetMapping("/user/{userId}/date")
    public ResponseEntity<ApiResponse<DailyDietSummary>> getByDate(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Diet summary fetched",
                        dietService.getDaySummary(userId, date)));
    }

    // Get Meal History
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<MealResponse>>> getHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Meal history fetched",
                        dietService.getHistory(userId)));
    }

    // Delete Meal
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMeal(
            @PathVariable Long id) {

        dietService.deleteMeal(id);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Meal deleted successfully", null));
    }

    // Save or Update Diet Goal
    @PostMapping("/goal")
    public ResponseEntity<ApiResponse<DietGoalResponse>> saveDietGoal(
            @Valid @RequestBody DietGoalRequest request) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Diet goal saved successfully",
                        dietService.saveDietGoal(request)));
    }

    // Get Diet Goal By User ID
    @GetMapping("/goal/user/{userId}")
    public ResponseEntity<ApiResponse<DietGoalResponse>> getDietGoal(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Diet goal fetched successfully",
                        dietService.getDietGoal(userId)));
    }

    // Get Daily Nutrition Dashboard
    @GetMapping("/user/{userId}/dashboard")
    public ResponseEntity<ApiResponse<DietDashboardResponse>> getDashboard(
            @PathVariable Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Nutrition dashboard fetched successfully",
                        dietService.getDashboard(userId, date)));
    }
}
