
package com.smartgym.entity;


import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_memberships")
public class UserMembership {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "plan_id", nullable = false)
    private MembershipPlan plan;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate expiryDate;

    private Boolean autoRenew = false;

    private String status; // ACTIVE / EXPIRED

    public UserMembership() {
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

    public MembershipPlan getPlan() {
    	return plan; 
    	}
    public void setPlan(MembershipPlan plan) { 
    	this.plan = plan;
    	}

    public LocalDate getStartDate() { 
    	return startDate; 
    	}
    public void setStartDate(LocalDate startDate) {
    	this.startDate = startDate;
    	}

    public LocalDate getExpiryDate() { 
    	return expiryDate;
    	}
    public void setExpiryDate(LocalDate expiryDate) { 
    	this.expiryDate = expiryDate;
    	}

    public Boolean getAutoRenew() { 
    	return autoRenew;
    	}
    public void setAutoRenew(Boolean autoRenew) {
    	this.autoRenew = autoRenew;
    	}

    public String getStatus() {
    	return status; 
    	}
    public void setStatus(String status) {
    	this.status = status; 
    	}

}
