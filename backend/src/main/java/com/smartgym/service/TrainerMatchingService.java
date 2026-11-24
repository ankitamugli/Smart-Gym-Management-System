
package com.smartgym.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartgym.dto.*;
import com.smartgym.entity.*;
import com.smartgym.repository.*;
import com.smartgym.exception.*;

@Service
public class TrainerMatchingService {

    private final TrainerRepository trainerRepository;
    private final TrainerBookingRepository bookingRepository;
    private final UserRepository userRepository;

    public TrainerMatchingService(
            TrainerRepository trainerRepository,
            TrainerBookingRepository bookingRepository,
            UserRepository userRepository) {

        this.trainerRepository = trainerRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    // 1. Add trainer
    public TrainerResponse addTrainer(TrainerRequest request) {

        validateTrainerRequest(request);

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (trainerRepository.existsByUserId(request.getUserId())) {
            throw new RuntimeException(
                    "This user is already registered as a trainer");
        }

        Trainer trainer = new Trainer();
        trainer.setUser(user);
        trainer.setSpecialization(request.getSpecialization());
        trainer.setExperienceYears(request.getExperienceYears());
        trainer.setSupportedGoals(request.getSupportedGoals());
        trainer.setHourlyRate(request.getHourlyRate());
        trainer.setBio(request.getBio());

        trainer.setAvailable(
                request.getAvailable() == null
                        ? true : request.getAvailable());

        trainer.setActive(true);

        return convertTrainer(trainerRepository.save(trainer));
    }

    // 2. Get all trainers
    public List<TrainerResponse> getAllTrainers() {

        return trainerRepository.findByActiveTrue()
                .stream()
                .map(this::convertTrainer)
                .collect(Collectors.toList());
    }

    // 3. Get trainer by ID
    public TrainerResponse getTrainerById(Long id) {

        Trainer trainer = trainerRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException("Trainer not found"));

        return convertTrainer(trainer);
    }

    // 4. Search by specialization
    public List<TrainerResponse> searchBySpecialization(
            String specialization) {

        if (specialization == null ||
                specialization.trim().isEmpty()) {
            throw new RuntimeException(
                    "Specialization is required");
        }

        return trainerRepository
                .findBySpecializationContainingIgnoreCaseAndActiveTrueAndAvailableTrue(
                        specialization.trim())
                .stream()
                .map(this::convertTrainer)
                .collect(Collectors.toList());
    }

    // 5. Match trainers by fitness goal
    public List<TrainerResponse> findMatchingTrainers(String goal) {

        if (goal == null || goal.trim().isEmpty()) {
            throw new RuntimeException("Fitness goal is required");
        }

        String requestedGoal = goal.trim();

        return trainerRepository.findByActiveTrueAndAvailableTrue()
                .stream()
                .filter(trainer -> trainer.getSupportedGoals() != null)
                .filter(trainer ->
                        Arrays.stream(
                                trainer.getSupportedGoals().split(","))
                                .anyMatch(g -> g.trim().equalsIgnoreCase(
                                        requestedGoal)))
                .sorted((a, b) ->
                        b.getExperienceYears().compareTo(
                                a.getExperienceYears()))
                .map(this::convertTrainer)
                .collect(Collectors.toList());
    }

    // 6. Book a trainer
    public TrainerBookingResponse bookTrainer(
            TrainerBookingRequest request) {

        if (request.getMemberId() == null ||
                request.getTrainerId() == null ||
                request.getScheduledAt() == null) {
            throw new RuntimeException(
                    "Member ID, trainer ID and booking date are required");
        }

        if (!request.getScheduledAt().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Booking date must be in the future");
        }

        User member = userRepository.findById(request.getMemberId())
                .orElseThrow(() ->
                        new RuntimeException("Member not found"));

        Trainer trainer = trainerRepository
                .findByIdAndActiveTrue(request.getTrainerId())
                .orElseThrow(() ->
                        new RuntimeException("Trainer not found"));

        if (!Boolean.TRUE.equals(trainer.getAvailable())) {
            throw new RuntimeException(
                    "Trainer is currently unavailable");
        }

        List<String> activeStatuses =
                List.of("PENDING", "ACCEPTED");

        boolean alreadyBooked = bookingRepository
                .existsByTrainerIdAndScheduledAtAndStatusIn(
                        trainer.getId(),
                        request.getScheduledAt(),
                        activeStatuses);

        if (alreadyBooked) {
            throw new RuntimeException(
                    "Trainer already has a booking at this time");
        }

        TrainerBooking booking = new TrainerBooking();

        booking.setMember(member);
        booking.setTrainer(trainer);
        booking.setScheduledAt(request.getScheduledAt());
        booking.setMessage(request.getMessage());
        booking.setStatus("PENDING");

        return convertBooking(bookingRepository.save(booking));
    }

    // 7. Get member bookings
    public List<TrainerBookingResponse> getMemberBookings(
            Long memberId) {

        if (!userRepository.existsById(memberId)) {
            throw new RuntimeException("Member not found");
        }

        return bookingRepository
                .findByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(this::convertBooking)
                .collect(Collectors.toList());
    }

    // 8. Get trainer bookings
    public List<TrainerBookingResponse> getTrainerBookings(
            Long trainerId) {

        if (!trainerRepository.existsById(trainerId)) {
            throw new RuntimeException("Trainer not found");
        }

        return bookingRepository
                .findByTrainerIdOrderByCreatedAtDesc(trainerId)
                .stream()
                .map(this::convertBooking)
                .collect(Collectors.toList());
    }

    // 9. Accept or reject booking
    @Transactional
    public TrainerBookingResponse updateBookingStatus(
            Long bookingId, BookingStatusRequest request) {

        TrainerBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        if (request.getStatus() == null) {
            throw new RuntimeException("Status is required");
        }

        String status = request.getStatus()
                .trim().toUpperCase(Locale.ROOT);

        if (!status.equals("ACCEPTED") &&
                !status.equals("REJECTED")) {
            throw new RuntimeException(
                    "Status must be ACCEPTED or REJECTED");
        }

        if (!booking.getStatus().equals("PENDING")) {
            throw new RuntimeException(
                    "Only pending bookings can be updated");
        }

        booking.setStatus(status);

        return convertBooking(bookingRepository.save(booking));
    }

    // 10. Cancel booking
    public String cancelBooking(Long bookingId, Long memberId) {

        TrainerBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        if (memberId == null ||
                !booking.getMember().getId().equals(memberId)) {
            throw new RuntimeException(
                    "You cannot cancel another member's booking");
        }

        if (booking.getStatus().equals("CANCELLED") ||
                booking.getStatus().equals("REJECTED")) {
            throw new RuntimeException(
                    "This booking cannot be cancelled");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        return "Booking cancelled successfully";
    }

    // Validation
    private void validateTrainerRequest(TrainerRequest request) {

        if (request.getUserId() == null) {
            throw new RuntimeException("Trainer user ID is required");
        }

        if (request.getSpecialization() == null ||
                request.getSpecialization().trim().isEmpty()) {
            throw new RuntimeException("Specialization is required");
        }

        if (request.getExperienceYears() == null ||
                request.getExperienceYears() < 0) {
            throw new RuntimeException(
                    "Experience years cannot be negative");
        }

        if (request.getSupportedGoals() == null ||
                request.getSupportedGoals().trim().isEmpty()) {
            throw new RuntimeException(
                    "Supported fitness goals are required");
        }

        if (request.getHourlyRate() != null &&
                request.getHourlyRate() < 0) {
            throw new RuntimeException(
                    "Hourly rate cannot be negative");
        }
    }

    // Convert Trainer entity to response
    private TrainerResponse convertTrainer(Trainer trainer) {

        return new TrainerResponse(
                trainer.getId(),
                trainer.getUser().getId(),
                trainer.getUser().getFullName(),
                trainer.getSpecialization(),
                trainer.getExperienceYears(),
                trainer.getSupportedGoals(),
                trainer.getHourlyRate(),
                trainer.getBio(),
                trainer.getAvailable(),
                trainer.getActive()
        );
    }

    // Convert Booking entity to response
    private TrainerBookingResponse convertBooking(
            TrainerBooking booking) {

        return new TrainerBookingResponse(
                booking.getId(),
                booking.getTrainer().getId(),
                booking.getTrainer().getUser().getFullName(),
                booking.getMember().getId(),
                booking.getMember().getFullName(),
                booking.getScheduledAt(),
                booking.getMessage(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
}
