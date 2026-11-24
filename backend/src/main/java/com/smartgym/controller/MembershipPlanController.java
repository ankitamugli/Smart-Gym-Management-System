
package com.smartgym.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.entity.MembershipPlan;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.MembershipPlanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/membership-plans")
@CrossOrigin(origins = "*")
public class MembershipPlanController {

    @Autowired
    private MembershipPlanService planService;

    // Create membership plan
    @PostMapping
    public ResponseEntity<ApiResponse<MembershipPlan>> createPlan(
            @Valid @RequestBody MembershipPlan plan) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Membership plan created successfully",
                        planService.createPlan(plan)
                ));
    }

    // Get all active plans
    @GetMapping
    public ResponseEntity<ApiResponse<List<MembershipPlan>>> getAllPlans() {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Membership plans fetched successfully",
                        planService.getAllActivePlans()
                ));
    }

    // Get plan by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MembershipPlan>> getPlanById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Membership plan fetched successfully",
                        planService.getPlanById(id)
                ));
    }

    // Update plan
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MembershipPlan>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody MembershipPlan plan) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Membership plan updated successfully",
                        planService.updatePlan(id, plan)
                ));
    }

    // Deactivate plan
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deactivatePlan(
            @PathVariable Long id) {

        planService.deactivatePlan(id);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Membership plan deactivated successfully",
                        "Deactivated"
                ));
    }
}
