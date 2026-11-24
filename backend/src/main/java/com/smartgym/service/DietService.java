
package com.smartgym.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartgym.dto.DailyDietSummary;
import com.smartgym.dto.MealRequest;
import com.smartgym.dto.MealResponse;
import com.smartgym.dto.DietGoalRequest;
import com.smartgym.dto.DietGoalResponse;
import com.smartgym.dto.DietDashboardResponse;

import com.smartgym.entity.MealLog;
import com.smartgym.entity.User;
import com.smartgym.entity.DietGoal;

import com.smartgym.repository.MealLogRepository;
import com.smartgym.repository.UserRepository;
import com.smartgym.repository.DietGoalRepository;

@Service
public class DietService {

    @Autowired
    private MealLogRepository mealLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DietGoalRepository dietGoalRepository;

    // ==================== LOG MEAL ====================

    public MealResponse logMeal(MealRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + request.getUserId()));

        MealLog meal = new MealLog();

        meal.setUser(user);
        meal.setMealName(request.getMealName());
        meal.setMealType(request.getMealType());
        meal.setCalories(request.getCalories());

        meal.setProtein(request.getProtein() != null
                ? request.getProtein() : 0.0);

        meal.setCarbs(request.getCarbs() != null
                ? request.getCarbs() : 0.0);

        meal.setFats(request.getFats() != null
                ? request.getFats() : 0.0);

        meal.setMealDate(request.getMealDate() != null
                ? request.getMealDate() : LocalDate.now());

        return toResponse(mealLogRepository.save(meal));
    }

    // ==================== DAILY SUMMARY ====================

    public DailyDietSummary getDaySummary(Long userId, LocalDate date) {

        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + userId));

        LocalDate day = date != null ? date : LocalDate.now();

        List<MealLog> logs = mealLogRepository
                .findByUserIdAndMealDateOrderByIdAsc(userId, day);

        double calories = logs.stream()
                .mapToDouble(MealLog::getCalories).sum();

        double protein = logs.stream()
                .mapToDouble(MealLog::getProtein).sum();

        double carbs = logs.stream()
                .mapToDouble(MealLog::getCarbs).sum();

        double fats = logs.stream()
                .mapToDouble(MealLog::getFats).sum();

        List<MealResponse> meals = logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new DailyDietSummary(
                day, meals.size(), calories, protein, carbs, fats, meals);
    }

    // ==================== MEAL HISTORY ====================

    public List<MealResponse> getHistory(Long userId) {

        return mealLogRepository
                .findByUserIdOrderByMealDateDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== DELETE MEAL ====================

    public void deleteMeal(Long mealId) {

        MealLog meal = mealLogRepository.findById(mealId)
                .orElseThrow(() -> new RuntimeException(
                        "Meal not found with id: " + mealId));

        mealLogRepository.delete(meal);
    }

    // ==================== MEAL RESPONSE ====================

    private MealResponse toResponse(MealLog m) {

        return new MealResponse(
                m.getId(),
                m.getUser().getId(),
                m.getMealName(),
                m.getMealType(),
                m.getCalories(),
                m.getProtein(),
                m.getCarbs(),
                m.getFats(),
                m.getMealDate()
        );
    }

    // ==================== GET OR CREATE DIET GOAL ====================

    private DietGoal getOrCreateDietGoal(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + userId));

        return dietGoalRepository.findByUserId(userId)
                .orElseGet(() -> {

                    DietGoal goal = new DietGoal();

                    goal.setUser(user);
                    goal.setCalorieGoal(2000.0);
                    goal.setProteinGoal(100.0);
                    goal.setCarbsGoal(250.0);
                    goal.setFatsGoal(65.0);
                    goal.setCupMl(250);

                    return dietGoalRepository.save(goal);
                });
    }

    // ==================== SAVE DIET GOAL ====================

    public DietGoalResponse saveDietGoal(DietGoalRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found"));

        DietGoal goal = dietGoalRepository
                .findByUserId(request.getUserId())
                .orElse(new DietGoal());

        goal.setUser(user);

        goal.setCalorieGoal(request.getCalorieGoal());

        goal.setProteinGoal(request.getProteinGoal() != null
                ? request.getProteinGoal() : 100.0);

        goal.setCarbsGoal(request.getCarbsGoal() != null
                ? request.getCarbsGoal() : 250.0);

        goal.setFatsGoal(request.getFatsGoal() != null
                ? request.getFatsGoal() : 65.0);

        goal.setCupMl(request.getCupMl() != null
                ? request.getCupMl() : 250);

        DietGoal saved = dietGoalRepository.save(goal);

        return toGoalResponse(saved);
    }

    // ==================== GET DIET GOAL ====================

    public DietGoalResponse getDietGoal(Long userId) {

        DietGoal goal = getOrCreateDietGoal(userId);

        return toGoalResponse(goal);
    }

    // ==================== GOAL RESPONSE ====================

    private DietGoalResponse toGoalResponse(DietGoal goal) {

        return new DietGoalResponse(
                goal.getId(),
                goal.getUser().getId(),
                goal.getCalorieGoal(),
                goal.getProteinGoal(),
                goal.getCarbsGoal(),
                goal.getFatsGoal(),
                goal.getCupMl()
        );
    }

    // ==================== NUTRITION DASHBOARD ====================

    public DietDashboardResponse getDashboard(
            Long userId, LocalDate date) {

        LocalDate day = date != null ? date : LocalDate.now();

        DietGoal goal = getOrCreateDietGoal(userId);

        List<MealLog> logs = mealLogRepository
                .findByUserIdAndMealDateOrderByIdAsc(userId, day);

        double calories = logs.stream()
                .mapToDouble(MealLog::getCalories).sum();

        double protein = logs.stream()
                .mapToDouble(MealLog::getProtein).sum();

        double carbs = logs.stream()
                .mapToDouble(MealLog::getCarbs).sum();

        double fats = logs.stream()
                .mapToDouble(MealLog::getFats).sum();

        double remainingCalories =
                Math.max(0, goal.getCalorieGoal() - calories);

        double remainingProtein =
                Math.max(0, goal.getProteinGoal() - protein);

        double remainingCarbs =
                Math.max(0, goal.getCarbsGoal() - carbs);

        double remainingFats =
                Math.max(0, goal.getFatsGoal() - fats);

        double percentage = goal.getCalorieGoal() > 0
                ? (calories / goal.getCalorieGoal()) * 100
                : 0;

        return new DietDashboardResponse(
                userId,
                day,
                goal.getCalorieGoal(),
                calories,
                remainingCalories,
                Math.round(percentage * 100.0) / 100.0,
                goal.getProteinGoal(),
                protein,
                remainingProtein,
                goal.getCarbsGoal(),
                carbs,
                remainingCarbs,
                goal.getFatsGoal(),
                fats,
                remainingFats
        );
    }
}
