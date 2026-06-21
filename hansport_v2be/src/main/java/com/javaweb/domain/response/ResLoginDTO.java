package com.javaweb.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.javaweb.domain.response.role.ResRoleDTO;
import com.javaweb.domain.response.user.ResUserDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResLoginDTO {
    @JsonProperty("access_token")
    private String accessToken;
    private UserLogin user;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserLogin {
        private long id;
        private String email;
        private String name;
        private String avatar;
        private ResRoleDTO role;

        public UserLogin(long id, String email, String name, ResRoleDTO role) {
            this.id = id;
            this.email = email;
            this.name = name;
            this.avatar = null;
            this.role = role;
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserInsideToken {
        private long id;
        private String email;
        private String name;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGetAccount{
        private ResUserDTO user;
    }
}
