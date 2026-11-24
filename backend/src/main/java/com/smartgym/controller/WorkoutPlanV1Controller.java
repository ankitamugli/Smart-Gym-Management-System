package com.smartgym.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartgym.entity.User;
import com.smartgym.entity.WorkoutPlan;
import com.smartgym.repository.UserRepository;
import com.smartgym.repository.WorkoutPlanRepository;
import com.smartgym.security.CurrentUser;

@RestController
@RequestMapping("/api/v1/workout-plans")
public class WorkoutPlanV1Controller {

    private static final String[] DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"};

    private final WorkoutPlanRepository planRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;

    public WorkoutPlanV1Controller(WorkoutPlanRepository planRepository,
                                   UserRepository userRepository, ObjectMapper mapper) {
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody Map<String, Object> prefs) {
        return buildPlan(prefs);
    }

    @GetMapping
    public List<Object> list() throws Exception {
        List<Object> out = new ArrayList<>();
        for (WorkoutPlan p : planRepository.findByUserIdOrderByCreatedAtDesc(CurrentUser.id())) {
            out.add(toView(p));
        }
        return out;
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody Map<String, Object> plan) throws Exception {
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> prefs = map(plan.get("preferences"));

        WorkoutPlan p = new WorkoutPlan();
        p.setUser(user);
        p.setFitnessGoal(String.valueOf(prefs.getOrDefault("goal", "fitness")));
        p.setFitnessLevel(String.valueOf(prefs.getOrDefault("level", "beginner")));
        p.setDaysPerWeek(num(prefs.get("daysPerWeek"), 3));
        p.setEquipment(String.valueOf(prefs.getOrDefault("equipment", "")));
        p.setWorkoutSchedule(mapper.writeValueAsString(plan));

        return ResponseEntity.status(HttpStatus.CREATED).body(toView(planRepository.save(p)));
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable Long id) {
        WorkoutPlan p = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        if (!p.getUser().getId().equals(CurrentUser.id())) {
            throw new RuntimeException("Plan not found");
        }
        planRepository.delete(p);
        return Map.of("ok", true);
    }

    // ---------- helpers ----------

    private Object toView(WorkoutPlan p) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>(map(mapper.readValue(p.getWorkoutSchedule(), Object.class)));
        m.put("id", String.valueOf(p.getId()));
        return m;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object o) {
        return o instanceof Map ? (Map<String, Object>) o : new LinkedHashMap<>();
    }

    private int num(Object o, int def) {
        return o instanceof Number n ? n.intValue() : def;
    }

    private Map<String, Object> buildPlan(Map<String, Object> prefs) {
        String goal = String.valueOf(prefs.getOrDefault("goal", "fitness"));
        String level = String.valueOf(prefs.getOrDefault("level", "beginner"));
        int minutes = num(prefs.get("durationMin"), 45);
        int perWeek = Math.max(1, Math.min(6, num(prefs.get("daysPerWeek"), 3)));
        List<?> eq = prefs.get("equipment") instanceof List<?> l ? l : List.of("bodyweight");

        int sets = level.equals("beginner") ? 2 : level.equals("intermediate") ? 3 : 4;
        String reps = goal.equals("muscle_gain") || goal.equals("strength") ? "8-10" : "12-15";

        int[][] pattern = {{0}, {0, 3}, {0, 2, 4}, {0, 1, 3, 4}, {0, 1, 2, 3, 4}, {0, 1, 2, 3, 4, 5}};
        List<Integer> trainDays = new ArrayList<>();
        for (int d : pattern[perWeek - 1]) trainDays.add(d);

        List<Object> days = new ArrayList<>();
        int setsPerWeek = 0;
        int session = 0;

        for (int i = 0; i < 7; i++) {
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("day", DAYS[i]);

            if (!trainDays.contains(i)) {
                day.put("focus", "Rest day");
                day.put("rest", true);
                day.put("estMinutes", 0);
                day.put("exercises", new ArrayList<>());
                day.put("note", "Rest or easy movement.");
                days.add(day);
                continue;
            }

            String focus;
            List<Object> ex = new ArrayList<>();
            boolean gym = eq.contains("barbell") || eq.contains("machines");
            boolean db = eq.contains("dumbbells");

            if (goal.equals("muscle_gain") || goal.equals("strength")) {
                if (session % 2 == 0) {
                    focus = "Upper body";
                    ex.add(ex(gym ? "bench-press" : "push-up", gym ? "Barbell bench press" : "Push ups",
                            "chest", gym ? "barbell" : "bodyweight", sets, reps, 90));
                    ex.add(ex(db ? "db-row" : "bw-row", db ? "Dumbbell row" : "Backpack row",
                            "back", db ? "dumbbells" : "bodyweight", sets, reps, 90));
                    ex.add(ex(db ? "db-press" : "pike-push", db ? "Dumbbell shoulder press" : "Pike push ups",
                            "shoulders", db ? "dumbbells" : "bodyweight", sets, reps, 90));
                } else {
                    focus = "Lower body";
                    ex.add(ex(gym ? "squat" : "bw-squat", gym ? "Barbell squat" : "Bodyweight squats",
                            "legs", gym ? "barbell" : "bodyweight", sets, reps, 90));
                    ex.add(ex("glute-bridge", "Glute bridges", "glutes", "bodyweight", sets, reps, 60));
                    ex.add(ex("calf-raise", "Calf raises", "calves", "bodyweight", sets, "15", 60));
                }
            } else if (goal.equals("weight_loss")) {
                focus = "Cardio and full body";
                ex.add(ex(eq.contains("cardio") ? "treadmill" : "jacks",
                        eq.contains("cardio") ? "Treadmill intervals" : "Jumping jacks",
                        "cardio", eq.contains("cardio") ? "cardio" : "bodyweight", sets, "10 min", 60));
                ex.add(ex("bw-squat", "Bodyweight squats", "legs", "bodyweight", sets, reps, 60));
                ex.add(ex("push-up", "Push ups", "chest", "bodyweight", sets, "10", 60));
                ex.add(ex("plank", "Plank", "core", "bodyweight", sets, "30 sec", 45));
            } else {
                focus = "Full body";
                ex.add(ex("walk", "Brisk walking", "cardio", "bodyweight", 1, "15 min", 60));
                ex.add(ex("bw-squat", "Bodyweight squats", "legs", "bodyweight", sets, reps, 60));
                ex.add(ex("push-up", "Push ups", "chest", "bodyweight", sets, "10", 60));
                ex.add(ex("plank", "Plank", "core", "bodyweight", sets, "30 sec", 45));
            }

            session++;
            setsPerWeek += sets * ex.size();
            day.put("focus", focus);
            day.put("rest", false);
            day.put("estMinutes", minutes);
            day.put("exercises", ex);
            days.add(day);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("split", goal.equals("muscle_gain") || goal.equals("strength")
                ? "Upper body / Lower body" : "Full body");
        summary.put("sessionsPerWeek", perWeek);
        summary.put("avgMinutes", minutes);
        summary.put("setsPerWeek", setsPerWeek);

        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("name", goal.replace('_', ' ') + " - " + level + " - " + perWeek + " days");
        plan.put("createdAt", Instant.now().toString());
        plan.put("preferences", prefs);
        plan.put("summary", summary);
        plan.put("days", days);
        plan.put("tips", List.of(
                "Warm up for 5 to 6 minutes before each session.",
                "Stop any exercise that causes sharp pain.",
                "Drink water and sleep 7 to 9 hours."));
        return plan;
    }

    private Map<String, Object> ex(String id, String name, String muscle, String equipment,
                                   int sets, String reps, int restSec) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("exerciseId", id);
        m.put("name", name);
        m.put("muscle", muscle);
        m.put("equipment", equipment);
        m.put("sets", sets);
        m.put("reps", reps);
        m.put("restSec", restSec);
        m.put("notes", "");
        return m;
    }
}