
package com.smartgym.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.*;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.TrainerMatchingService;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin(origins = "*")
public class TrainerMatchingController {

    private final TrainerMatchingService service;

    public TrainerMatchingController(TrainerMatchingService service) {
        this.service = service;
    }

    // 1. Add trainer
    @PostMapping
    public ResponseEntity<ApiResponse<TrainerResponse>> addTrainer(
            @RequestBody TrainerRequest request) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Trainer added successfully",
                        service.addTrainer(request)
                )
        );
    }

    // 2. Get all trainers
    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainerResponse>>> getAllTrainers() {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Trainers fetched successfully",
                        service.getAllTrainers()
                )
        );
    }

    // 3. Get trainer by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainerResponse>> getTrainerById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Trainer fetched successfully",
                        service.getTrainerById(id)
                )
        );
    }

    // 4. Search by specialization
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TrainerResponse>>> searchTrainers(
            @RequestParam String specialization) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Matching trainers fetched successfully",
                        service.searchBySpecialization(specialization)
                )
        );
    }

    // 5. Find trainers by fitness goal
    @GetMapping("/match")
    public ResponseEntity<ApiResponse<List<TrainerResponse>>> matchTrainers(
            @RequestParam String goal) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Recommended trainers fetched successfully",
                        service.findMatchingTrainers(goal)
                )
        );
    }

    // 6. Book trainer
    @PostMapping("/book")
    public ResponseEntity<ApiResponse<TrainerBookingResponse>> bookTrainer(
            @RequestBody TrainerBookingRequest request) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Trainer booking request submitted successfully",
                        service.bookTrainer(request)
                )
        );
    }

    // 7. Get member bookings
    @GetMapping("/bookings/member/{memberId}")
    public ResponseEntity<ApiResponse<List<TrainerBookingResponse>>> getMemberBookings(
            @PathVariable Long memberId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Member bookings fetched successfully",
                        service.getMemberBookings(memberId)
                )
        );
    }

    // 8. Get trainer bookings
    @GetMapping("/bookings/trainer/{trainerId}")
    public ResponseEntity<ApiResponse<List<TrainerBookingResponse>>> getTrainerBookings(
            @PathVariable Long trainerId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Trainer bookings fetched successfully",
                        service.getTrainerBookings(trainerId)
                )
        );
    }

    // 9. Accept or reject booking
    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<ApiResponse<TrainerBookingResponse>> updateStatus(
            @PathVariable Long bookingId,
            @RequestBody BookingStatusRequest request) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Booking status updated successfully",
                        service.updateBookingStatus(bookingId, request)
                )
        );
    }

    // 10. Cancel booking
    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<String>> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam Long memberId) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Booking cancelled successfully",
                        service.cancelBooking(bookingId, memberId)
                )
        );
    }
}
