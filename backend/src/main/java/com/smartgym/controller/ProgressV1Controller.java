package com.smartgym.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartgym.entity.ProgressRecord;
import com.smartgym.entity.User;
import com.smartgym.repository.ProgressRecordRepository;
import com.smartgym.repository.UserRepository;
import com.smartgym.security.CurrentUser;

@RestController
@RequestMapping("/api/v1")
public class ProgressV1Controller {

    private final ProgressRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;

    public ProgressV1Controller(ProgressRecordRepository recordRepository,
                                UserRepository userRepository, ObjectMapper mapper) {
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    // ---------- Workout log ----------

    @GetMapping("/workouts")
    public List<Map<String, Object>> listWorkouts() {
        return list("workout");
    }

    @PostMapping("/workouts")
    public ResponseEntity<Object> addWorkout(@RequestBody Map<String, Object> body) throws Exception {
        if (body.get("date") == null) {
            return error(400, "invalid_request", "Date is required.");
        }
        return create("workout", body);
    }

    @DeleteMapping("/workouts/{id}")
    public Map<String, Boolean> deleteWorkout(@PathVariable Long id) {
        return remove(id, "workout");
    }

    // ---------- Weight / body metrics ----------

    @GetMapping("/body-metrics")
    public List<Map<String, Object>> listMetrics() {
        return list("metric");
    }

    @PostMapping("/body-metrics")
    public ResponseEntity<Object> addMetric(@RequestBody Map<String, Object> body) throws Exception {
        if (body.get("date") == null) {
            return error(400, "invalid_request", "Date is required.");
        }
        if (!(body.get("weightKg") instanceof Number n) || n.doubleValue() <= 0) {
            return error(400, "invalid_request", "Enter a valid weight.");
        }
        return create("metric", body);
    }

    @DeleteMapping("/body-metrics/{id}")
    public Map<String, Boolean> deleteMetric(@PathVariable Long id) {
        return remove(id, "metric");
    }

    // ---------- Goal ----------

    @GetMapping("/goals")
    public Map<String, Object> getGoal() {
        List<Map<String, Object>> goals = list("goal");
        return goals.isEmpty() ? new LinkedHashMap<>() : goals.get(0);
    }

    @PutMapping("/goals")
    public Map<String, Object> saveGoal(@RequestBody Map<String, Object> body) throws Exception {
        User user = currentUser();
        List<ProgressRecord> existing =
                recordRepository.findByUserIdAndKindOrderByCreatedAtDesc(user.getId(), "goal");

        body.remove("id");
        ProgressRecord r = existing.isEmpty() ? new ProgressRecord() : existing.get(0);
        r.setUser(user);
        r.setKind("goal");
        r.setData(mapper.writeValueAsString(body));
        return view(recordRepository.save(r));
    }

    // ---------- Prediction (seedha rekha / linear trend) ----------

    @GetMapping("/progress/prediction")
    public Map<String, Object> prediction(@RequestParam(defaultValue = "12") int weeks) {
        weeks = Math.max(1, Math.min(52, weeks));

        List<LocalDate> dates = new ArrayList<>();
        List<Double> weights = new ArrayList<>();

        List<Map<String, Object>> metrics = new ArrayList<>(list("metric"));
        metrics.sort(Comparator.comparing(m -> String.valueOf(m.get("date"))));
        for (Map<String, Object> m : metrics) {
            try {
                dates.add(LocalDate.parse(String.valueOf(m.get("date"))));
                weights.add(((Number) m.get("weightKg")).doubleValue());
            } catch (Exception ignored) {
                // kharab entry chhod do
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("generatedBy", "server-linear-trend");
        res.put("weeks", new ArrayList<>());

        int n = dates.size();
        if (n < 3) {
            res.put("ok", false);
            res.put("reason", "Log at least 3 weight entries.");
            return res;
        }

        LocalDate first = dates.get(0);
        double sx = 0, sy = 0, sxy = 0, sxx = 0;
        for (int i = 0; i < n; i++) {
            double x = ChronoUnit.DAYS.between(first, dates.get(i));
            double y = weights.get(i);
            sx += x;
            sy += y;
            sxy += x * y;
            sxx += x * x;
        }
        double denom = n * sxx - sx * sx;
        if (denom == 0) {
            res.put("ok", false);
            res.put("reason", "Log weight entries on different days.");
            return res;
        }

        double slope = (n * sxy - sx * sy) / denom;
        double intercept = (sy - slope * sx) / n;

        double sq = 0;
        for (int i = 0; i < n; i++) {
            double x = ChronoUnit.DAYS.between(first, dates.get(i));
            double err = weights.get(i) - (intercept + slope * x);
            sq += err * err;
        }
        double std = Math.max(0.3, n > 2 ? Math.sqrt(sq / (n - 2)) : 0.5);

        LocalDate last = dates.get(n - 1);
        List<Object> out = new ArrayList<>();
        for (int i = 1; i <= weeks; i++) {
            LocalDate d = last.plusWeeks(i);
            double x = ChronoUnit.DAYS.between(first, d);
            double pred = intercept + slope * x;
            double band = std * (1 + i * 0.1);
            Map<String, Object> w = new LinkedHashMap<>();
            w.put("date", d.toString());
            w.put("predictedWeightKg", r1(pred));
            w.put("lower", r1(pred - band));
            w.put("upper", r1(pred + band));
            out.add(w);
        }

        res.put("ok", true);
        res.put("confidence", n < 5 ? "low" : n < 10 ? "moderate" : "high");
        res.put("weeklyChangeKg", Math.round(slope * 7 * 100.0) / 100.0);
        res.put("weeks", out);

        // Goal weight kab tak pahunchega
        List<Map<String, Object>> goals = list("goal");
        if (!goals.isEmpty() && goals.get(0).get("targetWeightKg") instanceof Number t && slope != 0) {
            double nowOnLine = intercept + slope * ChronoUnit.DAYS.between(first, last);
            double days = (t.doubleValue() - nowOnLine) / slope;
            if (days > 0 && days < 3650) {
                res.put("etaTargetDate", last.plusDays((long) days).toString());
            }
        }
        return res;
    }

    // ---------- helpers ----------

    private User currentUser() {
        return userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private List<Map<String, Object>> list(String kind) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ProgressRecord r : recordRepository.findByUserIdAndKindOrderByCreatedAtDesc(CurrentUser.id(), kind)) {
            Map<String, Object> v = view(r);
            if (v != null) out.add(v);
        }
        return out;
    }

    private ResponseEntity<Object> create(String kind, Map<String, Object> body) throws Exception {
        body.remove("id");
        ProgressRecord r = new ProgressRecord();
        r.setUser(currentUser());
        r.setKind(kind);
        r.setData(mapper.writeValueAsString(body));
        return ResponseEntity.status(HttpStatus.CREATED).body(view(recordRepository.save(r)));
    }

    private Map<String, Boolean> remove(Long id, String kind) {
        ProgressRecord r = recordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (!r.getUser().getId().equals(CurrentUser.id()) || !kind.equals(r.getKind())) {
            throw new RuntimeException("Not found");
        }
        recordRepository.delete(r);
        return Map.of("ok", true);
    }

    private Map<String, Object> view(ProgressRecord r) {
        try {
            Map<String, Object> m = new LinkedHashMap<>(
                    mapper.readValue(r.getData(), new TypeReference<Map<String, Object>>() {}));
            m.put("id", String.valueOf(r.getId()));
            m.put("createdAt", r.getCreatedAt() == null ? null : r.getCreatedAt() + "Z");
            return m;
        } catch (Exception e) {
            return null;
        }
    }

    private double r1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private ResponseEntity<Object> error(int status, String code, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("error", Map.of("code", code, "message", message)));
    }
}