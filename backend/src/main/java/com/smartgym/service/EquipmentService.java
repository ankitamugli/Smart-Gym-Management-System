
package com.smartgym.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartgym.dto.EquipmentRequest;
import com.smartgym.dto.EquipmentStatusRequest;
import com.smartgym.dto.EquipmentResponse;
import com.smartgym.entity.Equipment;
import com.smartgym.repository.EquipmentRepository;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public EquipmentResponse addEquipment(EquipmentRequest request) {

        validateRequest(request);

        Equipment equipment = new Equipment();

        equipment.setName(request.getName().trim());
        equipment.setCategory(request.getCategory());
        equipment.setBrand(request.getBrand());
        equipment.setTotalQuantity(request.getTotalQuantity());
        equipment.setAvailableQuantity(request.getAvailableQuantity());
        equipment.setLocation(request.getLocation());
        equipment.setLastMaintenanceDate(request.getLastMaintenanceDate());

        equipment.setStatus(calculateStatus(
                request.getTotalQuantity(),
                request.getAvailableQuantity()
        ));

        return convertToResponse(equipmentRepository.save(equipment));
    }

    public List<EquipmentResponse> getAllEquipment() {
        return equipmentRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public EquipmentResponse getEquipmentById(Long id) {
        return convertToResponse(findEquipment(id));
    }

    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentRequest request) {

        validateRequest(request);

        Equipment equipment = findEquipment(id);

        equipment.setName(request.getName().trim());
        equipment.setCategory(request.getCategory());
        equipment.setBrand(request.getBrand());
        equipment.setTotalQuantity(request.getTotalQuantity());
        equipment.setAvailableQuantity(request.getAvailableQuantity());
        equipment.setLocation(request.getLocation());
        equipment.setLastMaintenanceDate(request.getLastMaintenanceDate());

        equipment.setStatus(calculateStatus(
                request.getTotalQuantity(),
                request.getAvailableQuantity()
        ));

        return convertToResponse(equipmentRepository.save(equipment));
    }

    public String deleteEquipment(Long id) {

        Equipment equipment = findEquipment(id);

        equipmentRepository.delete(equipment);

        return "Equipment deleted successfully";
    }

    @Transactional
    public EquipmentResponse updateStatus(
            Long id, EquipmentStatusRequest request) {

        Equipment equipment = findEquipment(id);

        if (request.getAvailableQuantity() == null) {
            throw new RuntimeException("Available quantity is required");
        }

        if (request.getAvailableQuantity() < 0 ||
                request.getAvailableQuantity() > equipment.getTotalQuantity()) {
            throw new RuntimeException("Invalid available quantity");
        }

        String status = request.getStatus();

        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("Status is required");
        }

        status = status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("AVAILABLE", "IN_USE", "MAINTENANCE",
                "OUT_OF_SERVICE").contains(status)) {
            throw new RuntimeException("Invalid equipment status");
        }

        if ("MAINTENANCE".equals(status) ||
                "OUT_OF_SERVICE".equals(status)) {

            if (request.getAvailableQuantity() != 0) {
                throw new RuntimeException(
                        "Set available quantity to 0 for maintenance or out of service"
                );
            }
        }

        if ("AVAILABLE".equals(status) &&
                request.getAvailableQuantity() == 0) {
            throw new RuntimeException(
                    "Available quantity must be greater than 0"
            );
        }

        if ("IN_USE".equals(status) &&
                request.getAvailableQuantity().equals(equipment.getTotalQuantity())) {
            throw new RuntimeException(
                    "IN_USE requires at least one unit to be in use"
            );
        }

        equipment.setAvailableQuantity(request.getAvailableQuantity());
        equipment.setStatus(status);

        return convertToResponse(equipmentRepository.save(equipment));
    }

    public List<EquipmentResponse> getAvailableEquipment() {

        return equipmentRepository.findByAvailableQuantityGreaterThan(0)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<EquipmentResponse> getEquipmentByStatus(String status) {

        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("Status is required");
        }

        return equipmentRepository.findByStatusIgnoreCase(
                        status.trim().toUpperCase(Locale.ROOT))
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public EquipmentSummary getAvailabilitySummary() {

        List<Equipment> equipmentList = equipmentRepository.findAll();

        int totalEquipmentTypes = equipmentList.size();

        int totalUnits = 0;
        int availableUnits = 0;
        int inUseUnits = 0;
        int unavailableUnits = 0;

        for (Equipment equipment : equipmentList) {

            int total = equipment.getTotalQuantity();
            int available = equipment.getAvailableQuantity();

            totalUnits += total;
            availableUnits += available;

            if ("IN_USE".equals(equipment.getStatus())) {
                inUseUnits += total - available;
            }

            if ("MAINTENANCE".equals(equipment.getStatus()) ||
                    "OUT_OF_SERVICE".equals(equipment.getStatus())) {
                unavailableUnits += total - available;
            }
        }

        return new EquipmentSummary(
                totalEquipmentTypes,
                totalUnits,
                availableUnits,
                inUseUnits,
                unavailableUnits
        );
    }

    private Equipment findEquipment(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Equipment not found with id: " + id));
    }

    private void validateRequest(EquipmentRequest request) {

        if (request == null || request.getName() == null ||
                request.getName().trim().isEmpty()) {
            throw new RuntimeException("Equipment name is required");
        }

        if (request.getTotalQuantity() == null ||
                request.getTotalQuantity() <= 0) {
            throw new RuntimeException("Total quantity must be greater than 0");
        }

        if (request.getAvailableQuantity() == null ||
                request.getAvailableQuantity() < 0 ||
                request.getAvailableQuantity() > request.getTotalQuantity()) {
            throw new RuntimeException("Invalid available quantity");
        }
    }

    private String calculateStatus(int total, int available) {

        if (available == 0) {
            return "IN_USE";
        }

        if (available == total) {
            return "AVAILABLE";
        }

        return "IN_USE";
    }

    private EquipmentResponse convertToResponse(Equipment equipment) {

        return new EquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getCategory(),
                equipment.getBrand(),
                equipment.getTotalQuantity(),
                equipment.getAvailableQuantity(),
                equipment.getStatus(),
                equipment.getLocation(),
                equipment.getLastMaintenanceDate(),
                equipment.getCreatedAt()
        );
    }

    public static class EquipmentSummary {

        private int totalEquipmentTypes;
        private int totalUnits;
        private int availableUnits;
        private int inUseUnits;
        private int unavailableUnits;

        public EquipmentSummary(int totalEquipmentTypes, int totalUnits,
                int availableUnits, int inUseUnits, int unavailableUnits) {
            this.totalEquipmentTypes = totalEquipmentTypes;
            this.totalUnits = totalUnits;
            this.availableUnits = availableUnits;
            this.inUseUnits = inUseUnits;
            this.unavailableUnits = unavailableUnits;
        }

        public int getTotalEquipmentTypes() { return totalEquipmentTypes; }
        public int getTotalUnits() { return totalUnits; }
        public int getAvailableUnits() { return availableUnits; }
        public int getInUseUnits() { return inUseUnits; }
        public int getUnavailableUnits() { return unavailableUnits; }
    }
}
