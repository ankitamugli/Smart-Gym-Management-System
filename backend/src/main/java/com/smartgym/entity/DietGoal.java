
package com.smartgym.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "diet_goals")
public class DietGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Double calorieGoal;

    private Double proteinGoal;

    private Double carbsGoal;

    private Double fatsGoal;

    @Column(name = "cup_ml", nullable = false)
    private Integer cupMl = 250;

    public DietGoal() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getCalorieGoal() {
        return calorieGoal;
    }

    public void setCalorieGoal(Double calorieGoal) {
        this.calorieGoal = calorieGoal;
    }

    public Double getProteinGoal() {
        return proteinGoal;
    }

    public void setProteinGoal(Double proteinGoal) {
        this.proteinGoal = proteinGoal;
    }

    public Double getCarbsGoal() {
        return carbsGoal;
    }

    public void setCarbsGoal(Double carbsGoal) {
        this.carbsGoal = carbsGoal;
    }

    public Double getFatsGoal() {
        return fatsGoal;
    }

    public void setFatsGoal(Double fatsGoal) {
        this.fatsGoal = fatsGoal;
    }

    public Integer getCupMl() {
        return cupMl;
    }

    public void setCupMl(Integer cupMl) {
        this.cupMl = cupMl;
    }
}
