package com.smartgym.service;


import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartgym.dto.SleepRequest;
import com.smartgym.dto.SleepResponse;
import com.smartgym.entity.SleepLog;
import com.smartgym.entity.User;
import com.smartgym.repository.SleepLogRepository;
import com.smartgym.repository.UserRepository;

@Service
public class SleepService {
	
	@Autowired
    private SleepLogRepository sleepLogRepository;

    @Autowired
    private UserRepository userRepository;

    // Add sleep record
    public SleepResponse addSleep(SleepRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                    new RuntimeException("User not found with id: " + request.getUserId()));

        if (sleepLogRepository.findByUserIdAndSleepDate(
                request.getUserId(), request.getSleepDate()).isPresent()) {
            throw new RuntimeException("Sleep record already exists for this date");
        }

        SleepLog sleep = new SleepLog();

        sleep.setUser(user);
        sleep.setSleepDate(request.getSleepDate());
        sleep.setSleepHours(request.getSleepHours());
        sleep.setSleepQuality(request.getSleepQuality().toUpperCase());
        sleep.setNotes(request.getNotes());

        return toResponse(sleepLogRepository.save(sleep));
    }

    // Get today's sleep record
    public SleepResponse getTodaySleep(Long userId) {

        LocalDate today = LocalDate.now();

        SleepLog sleep = sleepLogRepository
                .findByUserIdAndSleepDate(userId, today)
                .orElseThrow(() ->
                    new RuntimeException("No sleep record found for today"));

        return toResponse(sleep);
    }

    // Get sleep record by date
    public SleepResponse getSleepByDate(Long userId, LocalDate date) {

        SleepLog sleep = sleepLogRepository
                .findByUserIdAndSleepDate(userId, date)
                .orElseThrow(() ->
                    new RuntimeException("Sleep record not found for this date"));

        return toResponse(sleep);
    }

    // Get sleep history
    public List<SleepResponse> getSleepHistory(Long userId) {

        return sleepLogRepository
                .findByUserIdOrderBySleepDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Delete sleep record
    public void deleteSleep(Long id) {

        SleepLog sleep = sleepLogRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Sleep record not found with id: " + id));

        sleepLogRepository.delete(sleep);
    }

    // Convert entity to response DTO
    private SleepResponse toResponse(SleepLog sleep) {

        return new SleepResponse(
                sleep.getId(),
                sleep.getUser().getId(),
                sleep.getUser().getFullName(),
                sleep.getSleepDate(),
                sleep.getSleepHours(),
                sleep.getSleepQuality(),
                sleep.getNotes()
        );
    }

}
