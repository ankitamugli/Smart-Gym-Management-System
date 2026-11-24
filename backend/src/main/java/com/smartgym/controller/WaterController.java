
package com.smartgym.controller;

import com.smartgym.entity.Water;
import com.smartgym.service.WaterService;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/water")
@CrossOrigin(origins = "*")
public class WaterController {

    private final WaterService service;

    public WaterController(WaterService service) {
        this.service = service;
    }

    @PutMapping("/{date}")
    public Water updateWater(
            @PathVariable LocalDate date,
            @RequestBody Map<String, Integer> request) {

        int cups = request.getOrDefault("cups", 0);

        return service.updateWater(date, cups);
    }

    @GetMapping("/{date}")
    public Water getWater(@PathVariable LocalDate date) {
        return service.getWater(date);
    }
}
