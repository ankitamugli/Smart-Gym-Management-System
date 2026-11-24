package com.smartgym.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartgym.dto.MembershipResponse;
import com.smartgym.entity.Attendance;
import com.smartgym.entity.User;
import com.smartgym.repository.AttendanceRepository;
import com.smartgym.repository.UserRepository;
import com.smartgym.security.CurrentUser;
import com.smartgym.security.JwtService;
import com.smartgym.service.UserMembershipService;

@RestController
@RequestMapping("/api/v1/checkins")
public class CheckinController {

    private static final String BRANCH = "FORMA Central";
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserMembershipService membershipService;

    public CheckinController(JwtService jwtService, UserRepository userRepository,
                             AttendanceRepository attendanceRepository,
                             UserMembershipService membershipService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.membershipService = membershipService;
    }

    // 1. Member ke QR ke liye 5 minute ka token
    @GetMapping("/qr-token")
    public Map<String, String> qrToken() {
        String token = jwtService.generateQr(CurrentUser.id());
        return Map.of("token", token, "expiresAt", Instant.now().plusSeconds(300).toString());
    }

    // 2. Scan kiya hua token verify karke visit record karo
    @PostMapping
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> body) {

        Long userId;
        try {
            userId = Long.valueOf(jwtService.parseQr(body.get("token")).getSubject());
        } catch (Exception e) {
            return error(422, "invalid_token", "This code is invalid or has expired. Refresh your QR code.");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return error(422, "invalid_token", "This code is invalid.");
        }

        MembershipResponse membership;
        try {
            membership = membershipService.getCurrentMembership(userId);
        } catch (RuntimeException e) {
            return error(403, "membership_expired", "Your membership has expired.");
        }

        LocalDate today = LocalDate.now();
        Attendance visit = attendanceRepository.findByUserIdOrderByCheckInTimeDesc(userId).stream()
                .filter(a -> a.getCheckInTime().toLocalDate().equals(today))
                .findFirst().orElse(null);

        boolean already = visit != null;
        if (!already) {
            visit = new Attendance();
            visit.setUser(user);
            visit.setCheckInTime(LocalDateTime.now());
            visit = attendanceRepository.save(visit);
        }

        Map<String, Object> member = new LinkedHashMap<>();
        member.put("name", user.getFullName());
        member.put("memberId", String.format("FRM-%06d", user.getId()));
        member.put("plan", membership.getPlanName());

        Map<String, Object> res = view(visit, body.get("method"));
        res.put("alreadyCheckedInToday", already);
        res.put("member", member);

        return ResponseEntity.status(already ? HttpStatus.OK : HttpStatus.CREATED).body(res);
    }

    // 3. Attendance history
    @GetMapping
    public List<Map<String, Object>> history() {
        return attendanceRepository.findByUserIdOrderByCheckInTimeDesc(CurrentUser.id())
                .stream().map(a -> view(a, "scan")).toList();
    }

    private Map<String, Object> view(Attendance a, String method) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", String.valueOf(a.getId()));
        m.put("date", a.getCheckInTime().toLocalDate().toString());
        m.put("time", a.getCheckInTime().format(TIME));
        m.put("method", method == null ? "scan" : method);
        m.put("branch", BRANCH);
        m.put("status", "verified");
        return m;
    }

    private ResponseEntity<Map<String, Object>> error(int status, String code, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("error", Map.of("code", code, "message", message)));
    }
}