
package com.smartgym.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "water")
public class Water {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "water_date", unique = true, nullable = false)
    private LocalDate waterDate;

    private int cups;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getWaterDate() {
        return waterDate;
    }

    public void setWaterDate(LocalDate waterDate) {
        this.waterDate = waterDate;
    }

    public int getCups() {
        return cups;
    }

    public void setCups(int cups) {
        this.cups = cups;
    }
}
