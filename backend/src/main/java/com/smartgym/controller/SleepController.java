
package com.smartgym.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.SleepRequest;
import com.smartgym.dto.SleepResponse;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.SleepService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sleep")
@CrossOrigin(origins = "*")
public class SleepController {

    @Autowired
    private SleepService sleepService;

    // Add sleep record
    @PostMapping("/log")
    public ResponseEntity<ApiResponse<SleepResponse>> addSleep(
            @Valid @RequestBody SleepRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Sleep record added successfully",
                        sleepService.addSleep(request)
                ));
    }

    // Get today's sleep
    @GetMapping("/user/{userId}/today")
    public ResponseEntity<ApiResponse<SleepResponse>> getTodaySleep(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Today's sleep record fetched successfully",
                        sleepService.getTodaySleep(userId)
                ));
    }

    // Get sleep by date
    @GetMapping("/user/{userId}/date")
    public ResponseEntity<ApiResponse<SleepResponse>> getSleepByDate(
            @PathVariable Long userId,
            @RequestParam LocalDate date) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Sleep record fetched successfully",
                        sleepService.getSleepByDate(userId, date)
                ));
    }

    // Get sleep history
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<SleepResponse>>> getSleepHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Sleep history fetched successfully",
                        sleepService.getSleepHistory(userId)
                ));
    }

    // Delete sleep record
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteSleep(
            @PathVariable Long id) {

        sleepService.deleteSleep(id);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Sleep record deleted successfully",
                        "Deleted"
                ));
    }
}
