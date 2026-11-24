package com.smartgym.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import com.smartgym.dto.WorkoutRequest;
import com.smartgym.service.WorkoutService;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "*")

public class WorkoutController {
	

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    // Generate workout plan
    @PostMapping("/generate")
    public ResponseEntity<?> generateWorkout(
            @Valid @RequestBody WorkoutRequest request) {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Workout plan generated successfully",
                "data", workoutService.generateWorkout(request)
        ));
    }

    // Get workout history
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWorkoutHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Workout history fetched successfully",
                "data", workoutService.getWorkoutHistory(userId)
        ));
    }

    // Get workout by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkoutById(
            @PathVariable Long id) {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Workout fetched successfully",
                "data", workoutService.getWorkoutById(id)
        ));
    }

    // Delete workout
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkout(
            @PathVariable Long id) {

        workoutService.deleteWorkout(id);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Workout deleted successfully",
                "data", "Deleted"
        ));
    }

}
