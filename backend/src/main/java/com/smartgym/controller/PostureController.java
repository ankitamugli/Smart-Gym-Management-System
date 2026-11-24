package com.smartgym.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import com.smartgym.dto.PostureRequest;
import com.smartgym.service.PostureService;

@RestController
@RequestMapping("/api/posture")
@CrossOrigin(origins = "*")
public class PostureController {
	
	 private final PostureService postureService;

	    public PostureController(PostureService postureService) {
	        this.postureService = postureService;
	    }

	    // Analyze posture
	    @PostMapping("/analyze")
	    public ResponseEntity<?> analyzePosture(
	            @Valid @RequestBody PostureRequest request) {

	        return ResponseEntity.ok(Map.of(
	                "success", true,
	                "message", "Posture analyzed successfully",
	                "data", postureService.analyzePosture(request)
	        ));
	    }

	    // Get user posture history
	    @GetMapping("/user/{userId}")
	    public ResponseEntity<?> getHistory(
	            @PathVariable Long userId) {

	        return ResponseEntity.ok(Map.of(
	                "success", true,
	                "message", "Posture history fetched successfully",
	                "data", postureService.getHistory(userId)
	        ));
	    }

	    // Get posture analysis by ID
	    @GetMapping("/{id}")
	    public ResponseEntity<?> getById(
	            @PathVariable Long id) {

	        return ResponseEntity.ok(Map.of(
	                "success", true,
	                "message", "Posture analysis fetched successfully",
	                "data", postureService.getById(id)
	        ));
	    }

	    // Delete posture analysis
	    @DeleteMapping("/{id}")
	    public ResponseEntity<?> deleteAnalysis(
	            @PathVariable Long id) {

	        postureService.deleteAnalysis(id);

	        return ResponseEntity.ok(Map.of(
	                "success", true,
	                "message", "Posture analysis deleted successfully",
	                "data", "Deleted"
	        ));
	    }

}
