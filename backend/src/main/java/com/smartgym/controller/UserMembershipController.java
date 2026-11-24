package com.smartgym.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.MembershipResponse;
import com.smartgym.dto.SubscribeRequest;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.UserMembershipService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/memberships")
@CrossOrigin(origins = "*")
public class UserMembershipController {

    @Autowired
    private UserMembershipService membershipService;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<MembershipResponse>> subscribe(@Valid @RequestBody SubscribeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Membership activated successfully 🎉",
                        membershipService.subscribe(request)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<MembershipResponse>> getCurrent(@PathVariable Long userId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Current membership fetched",
                membershipService.getCurrentMembership(userId)));
    }

    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<MembershipResponse>>> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Membership history fetched",
                membershipService.getHistory(userId)));
    }

    @PutMapping("/{id}/auto-renew")
    public ResponseEntity<ApiResponse<MembershipResponse>> setAutoRenew(
            @PathVariable Long id, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Auto renew updated",
                membershipService.setAutoRenew(id, enabled)));
    }

    // Testing ke liye: expired memberships ko manually process karo
    @PostMapping("/process-renewals")
    public ResponseEntity<ApiResponse<Integer>> processRenewals() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Renewal job completed",
                membershipService.processExpiredMemberships()));
    }
}