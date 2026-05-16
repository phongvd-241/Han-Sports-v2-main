package com.javaweb.domain.request;

import com.javaweb.util.validator.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
    public class ReqUserCreateDTO {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Password không được để trống")
    @StrongPassword
    private String password;

    @NotBlank(message = "Fullname không được để trống")
    @Size(min = 3, message = "Fullname phải có tối thiểu 3 ký tự")
    private String fullName;

    private String address;
    private String phone;
    private String roleName;
}
