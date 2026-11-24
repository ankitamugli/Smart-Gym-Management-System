
package com.smartgym.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EquipmentResponse {

    private Long id;
    private String name;
    private String category;
    private String brand;
    private Integer totalQuantity;
    private Integer availableQuantity;
    private String status;
    private String location;
    private LocalDate lastMaintenanceDate;
    private LocalDateTime createdAt;

    public EquipmentResponse(Long id, String name, String category,
            String brand, Integer totalQuantity, Integer availableQuantity,
            String status, String location,
            LocalDate lastMaintenanceDate, LocalDateTime createdAt) {

        this.id = id;
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.totalQuantity = totalQuantity;
        this.availableQuantity = availableQuantity;
        this.status = status;
        this.location = location;
        this.lastMaintenanceDate = lastMaintenanceDate;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getBrand() { return brand; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public Integer getAvailableQuantity() { return availableQuantity; }
    public String getStatus() { return status; }
    public String getLocation() { return location; }
    public LocalDate getLastMaintenanceDate() {
        return lastMaintenanceDate;
    }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
