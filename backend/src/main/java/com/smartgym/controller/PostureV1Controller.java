package com.smartgym.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartgym.entity.PostureAnalysis;
import com.smartgym.entity.User;
import com.smartgym.repository.PostureRepository;
import com.smartgym.repository.UserRepository;
import com.smartgym.security.CurrentUser;

@RestController
@RequestMapping("/api/v1/posture")
public class PostureV1Controller {

    private final PostureRepository postureRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;

    public PostureV1Controller(PostureRepository postureRepository,
                               UserRepository userRepository, ObjectMapper mapper) {
        this.postureRepository = postureRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    // 1. Exercise guides (dropdown aur checklist ke liye)
    @GetMapping("/guides")
    public Map<String, Object> guides() {
        Map<String, Object> g = new LinkedHashMap<>();

        g.put("squats", guide("Squats",
                "Place the camera at hip height, side-on, so your whole body is visible.",
                new String[][]{
                        {"Feet", "Shoulder-width apart, toes slightly turned out."},
                        {"Knees", "Track over your toes, do not cave inwards."},
                        {"Back", "Keep your chest up and back neutral."},
                        {"Depth", "Lower until thighs are about parallel to the floor."},
                        {"Heels", "Keep your heels flat on the ground."}},
                List.of("Knees caving in", "Heels lifting off the floor", "Rounding the lower back")));

        g.put("pushups", guide("Push ups",
                "Place the camera on the side, at floor level.",
                new String[][]{
                        {"Body line", "Head, hips and heels in one straight line."},
                        {"Hands", "Slightly wider than shoulders."},
                        {"Elbows", "About 45 degrees from your body."},
                        {"Depth", "Lower until your chest is close to the floor."}},
                List.of("Hips sagging", "Elbows flaring out", "Half reps")));

        g.put("deadlifts", guide("Deadlifts",
                "Place the camera side-on at hip height.",
                new String[][]{
                        {"Bar path", "Keep the bar close to your legs."},
                        {"Back", "Neutral spine, do not round your back."},
                        {"Hips", "Push your hips back as you lower."},
                        {"Lockout", "Stand tall, squeeze glutes at the top."}},
                List.of("Rounded back", "Bar drifting away from the body", "Jerking the bar off the floor")));

        return g;
    }

    // 2. Session save karo
    @PostMapping("/sessions")
    public ResponseEntity<Object> save(@RequestBody Map<String, Object> body) throws Exception {
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> new RuntimeException("User not found"));

        int ticked = num(body.get("checksTicked"));
        int total = num(body.get("checksTotal"));
        int score = total > 0 ? Math.round(ticked * 100f / total) : 0;

        PostureAnalysis a = new PostureAnalysis();
        a.setUser(user);
        a.setExerciseName(String.valueOf(body.getOrDefault("exercise", "squats")));
        a.setScore(score);
        a.setPostureStatus(score >= 80 ? "CORRECT" : "INCORRECT");
        a.setFeedback(mapper.writeValueAsString(body));

        return ResponseEntity.status(HttpStatus.CREATED).body(toView(postureRepository.save(a)));
    }

    // 3. Apne saare sessions
    @GetMapping("/sessions")
    public List<Object> list() {
        List<Object> out = new ArrayList<>();
        for (PostureAnalysis a : postureRepository.findByUserIdOrderByCreatedAtDesc(CurrentUser.id())) {
            Object v = toView(a);
            if (v != null) out.add(v);
        }
        return out;
    }

    // 4. Session delete (sirf apna)
    @DeleteMapping("/sessions/{id}")
    public Map<String, Boolean> delete(@PathVariable Long id) {
        PostureAnalysis a = postureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!a.getUser().getId().equals(CurrentUser.id())) {
            throw new RuntimeException("Session not found");
        }
        postureRepository.delete(a);
        return Map.of("ok", true);
    }

    // ---------- helpers ----------

    private Map<String, Object> toView(PostureAnalysis a) {
        try {
            Map<String, Object> m = new LinkedHashMap<>(
                    mapper.readValue(a.getFeedback(), new TypeReference<Map<String, Object>>() {}));
            m.put("id", String.valueOf(a.getId()));
            m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt() + "Z");
            return m;
        } catch (Exception e) {
            return null; // purane (alag format wale) rows chhod do
        }
    }

    private int num(Object o) {
        return o instanceof Number n ? n.intValue() : 0;
    }

    private Map<String, Object> guide(String label, String camera, String[][] cues, List<String> mistakes) {
        List<Object> cueList = new ArrayList<>();
        for (String[] c : cues) {
            Map<String, Object> cue = new LinkedHashMap<>();
            cue.put("t", c[0]);
            cue.put("d", c[1]);
            cueList.add(cue);
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("label", label);
        m.put("camera", camera);
        m.put("cues", cueList);
        m.put("mistakes", mistakes);
        return m;
    }
}