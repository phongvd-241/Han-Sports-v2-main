package com.javaweb.domain.response.user;

import com.javaweb.domain.response.role.ResRoleDTO;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResCreateUserDTO {
    private long id;
    private String email;
    private String fullName;
    private String address;
    private String phone;
    private boolean locked;
    private ResRoleDTO role;
    private Instant createdAt;
}
