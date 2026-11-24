package com.smartgym.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.AttendanceResponse;
import com.smartgym.dto.CheckInRequest;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.AttendanceService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "*")
public class AttendanceController {
	 @Autowired
	    private AttendanceService attendanceService;

	    @GetMapping("/api/qr/user/{userId}")
	    public ResponseEntity<ApiResponse<Map<String, String>>> getQr(@PathVariable Long userId) {
	        String token = attendanceService.getOrCreateQrToken(userId);
	        return ResponseEntity.ok(new ApiResponse<>(true, "QR token generated", Map.of("qrToken", token)));
	    }

	    @PostMapping("/api/attendance/check-in")
	    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(@Valid @RequestBody CheckInRequest request) {
	        return ResponseEntity.status(HttpStatus.CREATED)
	                .body(new ApiResponse<>(true, "Check-in successful 💪", attendanceService.checkIn(request.getQrToken())));
	    }

	    @PostMapping("/api/attendance/check-out")
	    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(@Valid @RequestBody CheckInRequest request) {
	        return ResponseEntity.ok(
	                new ApiResponse<>(true, "Check-out successful", attendanceService.checkOut(request.getQrToken())));
	    }

	    @GetMapping("/api/attendance/user/{userId}")
	    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getHistory(@PathVariable Long userId) {
	        return ResponseEntity.ok(
	                new ApiResponse<>(true, "Attendance history fetched", attendanceService.getHistory(userId)));
	    }

}
