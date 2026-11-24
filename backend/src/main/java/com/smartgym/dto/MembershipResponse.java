package com.smartgym.dto;

import java.time.LocalDate;

public class MembershipResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String planName;
    private Double price;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private long daysLeft;
    private Boolean autoRenew;
    private String status;

    public MembershipResponse(Long id, Long userId, String userName, String planName, Double price,
                              LocalDate startDate, LocalDate expiryDate, long daysLeft,
                              Boolean autoRenew, String status) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.planName = planName;
        this.price = price;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.daysLeft = daysLeft;
        this.autoRenew = autoRenew;
        this.status = status;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getPlanName() { return planName; }
    public Double getPrice() { return price; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public long getDaysLeft() { return daysLeft; }
    public Boolean getAutoRenew() { return autoRenew; }
    public String getStatus() { return status; }

}
