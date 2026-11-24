
package com.smartgym.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.smartgym.dto.*;
import com.smartgym.entity.User;
import com.smartgym.entity.WorkoutPlan;
import com.smartgym.repository.UserRepository;
import com.smartgym.repository.WorkoutPlanRepository;

@Service
public class WorkoutService {

    private final WorkoutPlanRepository workoutRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public WorkoutService(
            WorkoutPlanRepository workoutRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {

        this.workoutRepository = workoutRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    // Generate Workout Plan
    @Transactional
    public WorkoutResponse generateWorkout(WorkoutRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        validateRequest(request);

        List<WorkoutDayDTO> schedule = createWorkoutSchedule(request);

        try {
            WorkoutPlan plan = new WorkoutPlan();

            plan.setUser(user);
            plan.setFitnessGoal(request.getFitnessGoal());
            plan.setFitnessLevel(request.getFitnessLevel());
            plan.setDaysPerWeek(request.getDaysPerWeek());
            plan.setEquipment(request.getEquipment());

            plan.setWorkoutSchedule(
                    objectMapper.writeValueAsString(schedule));

            WorkoutPlan saved = workoutRepository.save(plan);

            return toResponse(saved);

        } catch (Exception e) {
            throw new RuntimeException(
                    "Unable to generate workout plan", e);
        }
    }

    // Validate Request
    private void validateRequest(WorkoutRequest request) {

        if (request.getFitnessGoal() == null ||
                request.getFitnessLevel() == null ||
                request.getEquipment() == null) {
            throw new RuntimeException("Workout details are required");
        }

        List<String> goals = List.of(
                "WEIGHT_LOSS", "MUSCLE_GAIN", "FITNESS");

        List<String> levels = List.of(
                "BEGINNER", "INTERMEDIATE", "ADVANCED");

        List<String> equipmentOptions = List.of(
                "GYM", "HOME", "NO_EQUIPMENT");

        if (!goals.contains(request.getFitnessGoal().toUpperCase())) {
            throw new RuntimeException("Invalid fitness goal");
        }

        if (!levels.contains(request.getFitnessLevel().toUpperCase())) {
            throw new RuntimeException("Invalid fitness level");
        }

        if (!equipmentOptions.contains(request.getEquipment().toUpperCase())) {
            throw new RuntimeException("Invalid equipment");
        }

        if (request.getDaysPerWeek() == null ||
                request.getDaysPerWeek() < 1 ||
                request.getDaysPerWeek() > 6) {
            throw new RuntimeException("Days per week must be between 1 and 6");
        }
    }

    // Create Personalized Workout Schedule
    private List<WorkoutDayDTO> createWorkoutSchedule(
            WorkoutRequest request) {

        List<WorkoutDayDTO> schedule = new ArrayList<>();

        String goal = request.getFitnessGoal().toUpperCase();
        String equipment = request.getEquipment().toUpperCase();
        String level = request.getFitnessLevel().toUpperCase();

        int sets = level.equals("BEGINNER") ? 2
                : level.equals("INTERMEDIATE") ? 3 : 4;

        int reps = goal.equals("MUSCLE_GAIN") ? 10 : 15;

        String[] days = {
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday"
        };

        for (int i = 0; i < request.getDaysPerWeek(); i++) {

            List<ExerciseDTO> exercises = new ArrayList<>();
            String workoutType;

            if (goal.equals("WEIGHT_LOSS")) {

                workoutType = "Cardio and Full Body";

                exercises.add(new ExerciseDTO(
                        equipment.equals("GYM")
                                ? "Treadmill Walking" : "Marching in Place",
                        sets, 15, 60));

                exercises.add(new ExerciseDTO(
                        "Bodyweight Squats", sets, reps, 60));

                exercises.add(new ExerciseDTO(
                        "Modified Push Ups", sets, 10, 60));

                exercises.add(new ExerciseDTO(
                        "Plank", sets, 1, 60));

            } else if (goal.equals("MUSCLE_GAIN")) {

                workoutType = i % 2 == 0
                        ? "Upper Body" : "Lower Body";

                if (i % 2 == 0) {

                    exercises.add(new ExerciseDTO(
                            equipment.equals("GYM")
                                    ? "Chest Press" : "Push Ups",
                            sets, reps, 90));

                    exercises.add(new ExerciseDTO(
                            equipment.equals("GYM")
                                    ? "Lat Pulldown" : "Backpack Rows",
                            sets, reps, 90));

                    exercises.add(new ExerciseDTO(
                            "Shoulder Press", sets, reps, 90));

                } else {

                    exercises.add(new ExerciseDTO(
                            "Bodyweight Squats", sets, reps, 90));

                    exercises.add(new ExerciseDTO(
                            "Glute Bridges", sets, reps, 90));

                    exercises.add(new ExerciseDTO(
                            "Calf Raises", sets, reps, 60));
                }

            } else {

                workoutType = "General Fitness";

                exercises.add(new ExerciseDTO(
                        "Walking", sets, 15, 60));

                exercises.add(new ExerciseDTO(
                        "Bodyweight Squats", sets, reps, 60));

                exercises.add(new ExerciseDTO(
                        "Wall Push Ups", sets, 10, 60));

                exercises.add(new ExerciseDTO(
                        "Plank", sets, 1, 60));
            }

            schedule.add(new WorkoutDayDTO(
                    days[i], workoutType, exercises));
        }

        return schedule;
    }

    // Get Workout History
    public List<WorkoutResponse> getWorkoutHistory(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return workoutRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Get Workout By ID
    public WorkoutResponse getWorkoutById(Long id) {

        WorkoutPlan plan = workoutRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Workout plan not found"));

        return toResponse(plan);
    }

    // Delete Workout
    @Transactional
    public void deleteWorkout(Long id) {

        if (!workoutRepository.existsById(id)) {
            throw new RuntimeException("Workout plan not found");
        }

        workoutRepository.deleteById(id);
    }

    // Convert Entity to Response
    private WorkoutResponse toResponse(WorkoutPlan plan) {

        try {
            WorkoutResponse response = new WorkoutResponse();

            response.setId(plan.getId());
            response.setUserId(plan.getUser().getId());
            response.setFitnessGoal(plan.getFitnessGoal());
            response.setFitnessLevel(plan.getFitnessLevel());
            response.setDaysPerWeek(plan.getDaysPerWeek());
            response.setEquipment(plan.getEquipment());

            response.setWorkoutSchedule(
                    objectMapper.readValue(
                            plan.getWorkoutSchedule(),
                            new TypeReference<List<WorkoutDayDTO>>() {}
                    )
            );

            response.setCreatedAt(plan.getCreatedAt());

            return response;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Unable to read workout plan", e);
        }
    }
}
