package com.smartgym.dto;

import jakarta.validation.constraints.NotNull;

public class SubscribeRequest {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Plan id is required")
    private Long planId;

    private Boolean autoRenew = false;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public Boolean getAutoRenew() { return autoRenew; }
    public void setAutoRenew(Boolean autoRenew) { this.autoRenew = autoRenew; }

}
