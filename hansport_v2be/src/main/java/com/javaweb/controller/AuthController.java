package com.javaweb.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.javaweb.domain.User;
import com.javaweb.domain.request.ReqAccountUpdateDTO;
import com.javaweb.domain.request.ReqChangePasswordDTO;
import com.javaweb.domain.request.ReqGoogleLoginDTO;
import com.javaweb.domain.request.ReqLoginDTO;
import com.javaweb.domain.request.ReqRegisterDTO;
import com.javaweb.domain.response.ResLoginDTO;
import com.javaweb.domain.response.role.ResRoleDTO;
import com.javaweb.domain.response.user.ResCreateUserDTO;
import com.javaweb.domain.response.user.ResUserDTO;
import com.javaweb.service.GoogleTokenVerifierService;
import com.javaweb.service.UserService;
import com.javaweb.util.SecurityUtil;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityUtil securityUtil;
    private final UserService userService;
    private final GoogleTokenVerifierService  googleTokenVerifierService;

    @Value("${hansport.jwt.refreshtoken-validity-in-seconds}")
    private Long refreshTokenExpiration;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    public AuthController(AuthenticationManagerBuilder authenticationManagerBuilder, SecurityUtil securityUtil, UserService userService, GoogleTokenVerifierService googleTokenVerifierService) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
        this.userService = userService;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ResLoginDTO> login(@RequestBody @Valid ReqLoginDTO loginDTO) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDTO.getUsername(), loginDTO.getPassword());

        Authentication authentication = authenticationManagerBuilder.getObject()
                .authenticate(authenticationToken);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        ResLoginDTO resLoginDTO = new ResLoginDTO();
        User currentUserDB = this.userService.getUserByUsername(loginDTO.getUsername());
        if (currentUserDB == null) {
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException("Username/password không hợp lệ");
        }

        ResRoleDTO role = this.convertToRoleDTO(currentUserDB);
        ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                currentUserDB.getId(),
                currentUserDB.getEmail(),
                currentUserDB.getFullName(),
                role);
        resLoginDTO.setUser(userLogin);

        String access_token = this.securityUtil.createAccessToken(authentication.getName(), resLoginDTO);
        resLoginDTO.setAccessToken(access_token);

        String refresh_token = this.securityUtil.createRefreshToken(loginDTO.getUsername(), resLoginDTO);

        this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(refresh_token), loginDTO.getUsername());

        ResponseCookie resCookies = ResponseCookie
                .from("refresh_token", refresh_token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite("Lax")
                .maxAge(refreshTokenExpiration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(resLoginDTO);
    }

    @PostMapping("/auth/google")
    public ResponseEntity<ResLoginDTO> login(@RequestBody ReqGoogleLoginDTO reqGoogleLoginDTO)throws Exception {

        GoogleIdToken.Payload payload =
                googleTokenVerifierService
                        .verify(reqGoogleLoginDTO.getIdToken());

        String email = payload.getEmail();
        String name = (String) payload.get("name");

        this.userService.googleUser(email, name);

        User currentUserDB = this.userService.getUserByUsername(email);
        if (currentUserDB == null) {
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException("Email không hợp lệ");
        }

        ResRoleDTO role = this.convertToRoleDTO(currentUserDB);
        ResLoginDTO.UserLogin user = new ResLoginDTO.UserLogin(
                currentUserDB.getId(),
                currentUserDB.getEmail(),
                currentUserDB.getFullName(),
                role);

        ResLoginDTO resLoginDTO = new ResLoginDTO();
        resLoginDTO.setUser(user);

        String accessToken = securityUtil.createAccessToken(email, resLoginDTO);
        resLoginDTO.setAccessToken(accessToken);

        String refresh_token = this.securityUtil.createRefreshToken(email, resLoginDTO);

        this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(refresh_token), email);

        ResponseCookie resCookies = ResponseCookie
                .from("refresh_token", refresh_token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite("Lax")
                .maxAge(refreshTokenExpiration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(resLoginDTO);
    }

    @PostMapping("/auth/register")
    @ApiMessage("register a user")
    public ResponseEntity<ResCreateUserDTO> register(@RequestBody @Valid ReqRegisterDTO registerDTO) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.register(registerDTO));
    }

    @GetMapping("/auth/account")
    @ApiMessage("fetch account")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() throws IdInvalidException {
        String email = this.currentEmailOrThrow();
        User currentUserDB = this.userService.getUserByUsername(email);
        if (currentUserDB == null) {
            throw new IdInvalidException("User does not exist");
        }
        ResLoginDTO.UserGetAccount userGetAccount = new ResLoginDTO.UserGetAccount();
        userGetAccount.setUser(this.userService.convertToResUserDTO(currentUserDB));

        return ResponseEntity.ok().body(userGetAccount);
    }

    @PutMapping("/auth/account")
    @ApiMessage("update account profile")
    public ResponseEntity<ResUserDTO> updateAccount(@RequestBody @Valid ReqAccountUpdateDTO req) throws IdInvalidException {
        return ResponseEntity.ok(this.userService.updateAccountProfile(this.currentEmailOrThrow(), req));
    }

    @GetMapping("/auth/refresh")
    @ApiMessage("get user by refresh token")
    public ResponseEntity<ResLoginDTO> getRefeshToken(@CookieValue(name = "refresh_token", defaultValue = "abc") String refresh_token) throws IdInvalidException {
        if (refresh_token.equals("abc")) {
            throw new IdInvalidException("Bạn không có refresh token ở cookie");
        }

        Jwt decodedToken = this.securityUtil.checkValidRefreshToken(refresh_token);
        String email = decodedToken.getSubject();

        User currentUser = this.userService.getUserByRefreshTokenHashAndEmail(this.securityUtil.hashRefreshToken(refresh_token), email);
        if (currentUser == null) {
            throw new IdInvalidException("Refresh Token không hợp lệ");
        }

        ResLoginDTO res = new ResLoginDTO();
        User currentUserDB = this.userService.getUserByUsername(email);
        if (currentUserDB != null) {
            ResRoleDTO role = this.convertToRoleDTO(currentUserDB);

            ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                    currentUserDB.getId(),
                    currentUserDB.getEmail(),
                    currentUserDB.getFullName(),
                    role);
            res.setUser(userLogin);
        }

        String access_token = this.securityUtil.createAccessToken(email, res);
        res.setAccessToken(access_token);

        String new_refresh_token = this.securityUtil.createRefreshToken(email, res);

        this.userService.updateUserRefreshTokenHash(this.securityUtil.hashRefreshToken(new_refresh_token), email);

        ResponseCookie resCookies = ResponseCookie
                .from("refresh_token", new_refresh_token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite("Lax")
                .maxAge(refreshTokenExpiration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(res);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout Use")
    public ResponseEntity<Void> logoutAccount() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";

        if (email.equals("")) {
            throw new IdInvalidException("Access Token không hợp lệ");
        }

        this.userService.updateUserRefreshTokenHash(null, email);

        ResponseCookie deleteSpringCookie = ResponseCookie
                .from("refresh_token", null)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteSpringCookie.toString())
                .body(null);
    }

    @PostMapping("/auth/change-password")
    @ApiMessage("Change password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ReqChangePasswordDTO req) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";

        if (email.equals("")) {
            throw new IdInvalidException("Access Token khong hop le");
        }

        this.userService.changePassword(email, req);

        ResponseCookie deleteSpringCookie = ResponseCookie
                .from("refresh_token", null)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteSpringCookie.toString())
                .body(null);
    }

    private ResRoleDTO convertToRoleDTO(User user) {
        if (user.getRole() == null) {
            return null;
        }
        return new ResRoleDTO(user.getRole().getName(), user.getRole().getDecription());
    }

    private String currentEmailOrThrow() throws IdInvalidException {
        return SecurityUtil.getCurrentUserLogin()
                .filter(email -> !email.isBlank())
                .orElseThrow(() -> new IdInvalidException("Access token is invalid"));
    }
}
