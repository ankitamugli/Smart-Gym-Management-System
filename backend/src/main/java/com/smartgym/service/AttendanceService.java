package com.smartgym.service;


import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartgym.dto.AttendanceResponse;
import com.smartgym.entity.Attendance;
import com.smartgym.entity.User;
import com.smartgym.repository.AttendanceRepository;
import com.smartgym.repository.UserRepository;

@Service
public class AttendanceService {
	
	 @Autowired
	    private AttendanceRepository attendanceRepository;

	    @Autowired
	    private UserRepository userRepository;

	    @Autowired
	    private UserMembershipService membershipService;

	    // Member ka QR token (pehli baar generate hota hai)
	    public String getOrCreateQrToken(Long userId) {
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

	        if (user.getQrToken() == null) {
	            user.setQrToken(UUID.randomUUID().toString());
	            userRepository.save(user);
	        }
	        return user.getQrToken();
	    }

	    public AttendanceResponse checkIn(String qrToken) {
	        User user = userRepository.findByQrToken(qrToken)
	                .orElseThrow(() -> new RuntimeException("Invalid QR code"));

	        // Active membership zaroori (nahi hai to exception aayegi)
	        membershipService.getCurrentMembership(user.getId());

	        if (attendanceRepository.findFirstByUserIdAndCheckOutTimeIsNull(user.getId()).isPresent()) {
	            throw new RuntimeException("Already checked in. Please check out first");
	        }

	        Attendance attendance = new Attendance();
	        attendance.setUser(user);
	        attendance.setCheckInTime(LocalDateTime.now());

	        return toResponse(attendanceRepository.save(attendance));
	    }

	    public AttendanceResponse checkOut(String qrToken) {
	        User user = userRepository.findByQrToken(qrToken)
	                .orElseThrow(() -> new RuntimeException("Invalid QR code"));

	        Attendance attendance = attendanceRepository.findFirstByUserIdAndCheckOutTimeIsNull(user.getId())
	                .orElseThrow(() -> new RuntimeException("No active check-in found"));

	        attendance.setCheckOutTime(LocalDateTime.now());
	        return toResponse(attendanceRepository.save(attendance));
	    }

	    public List<AttendanceResponse> getHistory(Long userId) {
	        return attendanceRepository.findByUserIdOrderByCheckInTimeDesc(userId)
	                .stream().map(this::toResponse).collect(Collectors.toList());
	    }

	    private AttendanceResponse toResponse(Attendance a) {
	        Long minutes = null;
	        if (a.getCheckOutTime() != null) {
	            minutes = Duration.between(a.getCheckInTime(), a.getCheckOutTime()).toMinutes();
	        }
	        return new AttendanceResponse(a.getId(), a.getUser().getId(), a.getUser().getFullName(),
	                a.getCheckInTime(), a.getCheckOutTime(), minutes);
	    }

}
