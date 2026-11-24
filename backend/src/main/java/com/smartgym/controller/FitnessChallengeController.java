
package com.smartgym.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.*;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.FitnessChallengeService;

@RestController
@RequestMapping("/api/challenges")
@CrossOrigin(origins = "*")
public class FitnessChallengeController {

    @Autowired
    private FitnessChallengeService challengeService;

    // CREATE CHALLENGE
    @PostMapping
    public ResponseEntity<ApiResponse<ChallengeResponse>> create(
            @RequestBody ChallengeRequest request) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge created successfully",
                challengeService.createChallenge(request)
        ));
    }

    // GET ALL CHALLENGES
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getAll() {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenges fetched successfully",
                challengeService.getAllChallenges()
        ));
    }

    // GET ACTIVE CHALLENGES
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getActive() {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Active challenges fetched successfully",
                challengeService.getActiveChallenges()
        ));
    }

    // GET CHALLENGE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge fetched successfully",
                challengeService.getChallenge(id)
        ));
    }

    // UPDATE CHALLENGE
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChallengeResponse>> update(
            @PathVariable Long id,
            @RequestBody ChallengeRequest request) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge updated successfully",
                challengeService.updateChallenge(id, request)
        ));
    }

    // DELETE CHALLENGE
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge deleted successfully",
                challengeService.deleteChallenge(id)
        ));
    }

    // JOIN CHALLENGE
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<ParticipationResponse>> join(
            @RequestBody JoinChallengeRequest request) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge joined successfully",
                challengeService.joinChallenge(request)
        ));
    }

    // UPDATE PROGRESS
    @PutMapping("/progress/{participationId}")
    public ResponseEntity<ApiResponse<ParticipationResponse>> updateProgress(
            @PathVariable Long participationId,
            @RequestBody ProgressRequest request) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Challenge progress updated successfully",
                challengeService.updateProgress(participationId, request)
        ));
    }

    // USER CHALLENGES
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ParticipationResponse>>> getUserChallenges(
            @PathVariable Long userId) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "User challenges fetched successfully",
                challengeService.getUserChallenges(userId)
        ));
    }

    // LEADERBOARD
    @GetMapping("/leaderboard/{challengeId}")
    public ResponseEntity<ApiResponse<List<LeaderboardResponse>>> leaderboard(
            @PathVariable Long challengeId) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Leaderboard fetched successfully",
                challengeService.getLeaderboard(challengeId)
        ));
    }
}
