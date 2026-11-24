
package com.smartgym.service;

import com.smartgym.entity.Water;
import com.smartgym.repository.WaterRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class WaterService {

    private final WaterRepository repository;

    public WaterService(WaterRepository repository) {
        this.repository = repository;
    }

    public Water updateWater(LocalDate date, int cups) {

        if (cups < 0) {
            throw new IllegalArgumentException("Cups cannot be negative");
        }

        Water water = repository.findByWaterDate(date)
                .orElseGet(Water::new);

        water.setWaterDate(date);
        water.setCups(cups);

        return repository.save(water);
    }

    public Water getWater(LocalDate date) {

        return repository.findByWaterDate(date)
                .orElseGet(() -> {
                    Water water = new Water();
                    water.setWaterDate(date);
                    water.setCups(0);
                    return water;
                });
    }
}
