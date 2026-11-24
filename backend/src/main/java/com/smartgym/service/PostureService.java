package com.smartgym.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.smartgym.dto.PostureRequest;
import com.smartgym.dto.PostureResponse;
import com.smartgym.entity.PostureAnalysis;
import com.smartgym.entity.User;
import com.smartgym.repository.PostureRepository;
import com.smartgym.repository.UserRepository;

@Service
public class PostureService {
	
	 private final PostureRepository postureRepository;
	    private final UserRepository userRepository;

	    public PostureService(
	            PostureRepository postureRepository,
	            UserRepository userRepository) {

	        this.postureRepository = postureRepository;
	        this.userRepository = userRepository;
	    }

	    // Analyze posture
	    public PostureResponse analyzePosture(PostureRequest request) {

	        User user = userRepository.findById(request.getUserId())
	                .orElseThrow(() ->
	                        new RuntimeException("User not found"));

	        String exercise = request.getExerciseName()
	                .trim().toUpperCase();

	        if (!exercise.equals("SQUAT")) {
	            throw new IllegalArgumentException(
	                    "Currently only SQUAT posture is supported");
	        }

	        double knee = request.getKneeAngle();
	        double back = request.getBackAngle();

	        int score = 100;

	        StringBuilder feedback = new StringBuilder();

	        // Check knee angle
	        if (knee > 110) {
	            score -= 30;
	            feedback.append(
	                    "Bend your knees more to improve squat depth. ");
	        } else if (knee < 70) {
	            score -= 20;
	            feedback.append(
	                    "Avoid excessive knee bending. ");
	        }

	        // Check back angle
	        if (back > 35) {
	            score -= 40;
	            feedback.append(
	                    "Keep your back more upright. ");
	        }

	        if (feedback.length() == 0) {
	            feedback.append(
	                    "Excellent posture! Your squat form looks good.");
	        }

	        String status = score >= 80
	                ? "CORRECT"
	                : "INCORRECT";

	        PostureAnalysis analysis = new PostureAnalysis();

	        analysis.setUser(user);
	        analysis.setExerciseName(exercise);
	        analysis.setKneeAngle(knee);
	        analysis.setBackAngle(back);
	        analysis.setScore(Math.max(score, 0));
	        analysis.setPostureStatus(status);
	        analysis.setFeedback(feedback.toString());

	        PostureAnalysis saved =
	                postureRepository.save(analysis);

	        return toResponse(saved);
	    }

	    // Get posture history
	    public List<PostureResponse> getHistory(Long userId) {

	        if (!userRepository.existsById(userId)) {
	            throw new RuntimeException("User not found");
	        }

	        return postureRepository
	                .findByUserIdOrderByCreatedAtDesc(userId)
	                .stream()
	                .map(this::toResponse)
	                .toList();
	    }

	    // Get analysis by ID
	    public PostureResponse getById(Long id) {

	        PostureAnalysis analysis = postureRepository.findById(id)
	                .orElseThrow(() ->
	                        new RuntimeException("Posture analysis not found"));

	        return toResponse(analysis);
	    }

	    // Delete analysis
	    public void deleteAnalysis(Long id) {

	        if (!postureRepository.existsById(id)) {
	            throw new RuntimeException("Posture analysis not found");
	        }

	        postureRepository.deleteById(id);
	    }

	    // Convert entity to response
	    private PostureResponse toResponse(PostureAnalysis analysis) {

	        PostureResponse response = new PostureResponse();

	        response.setId(analysis.getId());
	        response.setUserId(analysis.getUser().getId());
	        response.setExerciseName(analysis.getExerciseName());
	        response.setKneeAngle(analysis.getKneeAngle());
	        response.setBackAngle(analysis.getBackAngle());
	        response.setScore(analysis.getScore());
	        response.setPostureStatus(analysis.getPostureStatus());
	        response.setFeedback(analysis.getFeedback());
	        response.setCreatedAt(analysis.getCreatedAt());

	        return response;
	    }

}
