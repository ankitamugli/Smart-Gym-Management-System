package com.smartgym.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.EquipmentRequest;
import com.smartgym.dto.EquipmentResponse;
import com.smartgym.dto.EquipmentStatusRequest;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.EquipmentService;
import com.smartgym.service.EquipmentService.EquipmentSummary;

@RestController
@RequestMapping("/api/v1/equipment")
@CrossOrigin(origins = "*")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    // ---------- Frontend (FORMA) ke liye ----------

    public record EquipmentView(String id, String name, String category, String type,
                                String zone, String status, int waitMinutes, String updatedAt) {}

    @GetMapping
    public List<EquipmentView> getAllEquipment() {
        return equipmentService.getAllEquipment().stream().map(this::toView).toList();
    }

    private EquipmentView toView(EquipmentResponse e) {
        String name = e.getName() == null ? "" : e.getName();
        String status = switch (e.getStatus() == null ? "" : e.getStatus().toUpperCase()) {
            case "IN_USE" -> "occupied";
            case "MAINTENANCE", "OUT_OF_SERVICE" -> "maintenance";
            default -> "available";
        };
        return new EquipmentView(
                String.valueOf(e.getId()),
                name,
                e.getCategory() == null ? "General" : e.getCategory(),
                name.toLowerCase().contains("treadmill") ? "treadmill" : "dumbbell",
                e.getLocation() == null ? "Gym floor" : e.getLocation(),
                status,
                "occupied".equals(status) ? 10 : 0,
                e.getCreatedAt() == null ? null : e.getCreatedAt() + "Z");
    }

    // ---------- Purane endpoints (jaise the waise) ----------

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentResponse>> addEquipment(@RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment added successfully",
                equipmentService.addEquipment(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment fetched successfully",
                equipmentService.getEquipmentById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable Long id, @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment updated successfully",
                equipmentService.updateEquipment(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment deleted successfully",
                equipmentService.deleteEquipment(id)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateStatus(
            @PathVariable Long id, @RequestBody EquipmentStatusRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment status updated successfully",
                equipmentService.updateStatus(id, request)));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getAvailableEquipment() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Available equipment fetched successfully",
                equipmentService.getAvailableEquipment()));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getEquipmentByStatus(@PathVariable String status) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment by status fetched successfully",
                equipmentService.getEquipmentByStatus(status)));
    }

    @GetMapping("/availability/summary")
    public ResponseEntity<ApiResponse<EquipmentSummary>> getAvailabilitySummary() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment availability summary fetched successfully",
                equipmentService.getAvailabilitySummary()));
    }
}