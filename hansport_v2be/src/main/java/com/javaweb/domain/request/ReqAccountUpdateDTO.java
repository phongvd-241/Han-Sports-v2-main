package com.javaweb.domain.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqAccountUpdateDTO {
    @Size(min = 3, max = 255, message = "Full name must be between 3 and 255 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9+() .-]{0,30}$", message = "Phone number is invalid")
    private String phone;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    private String avatar;
}
