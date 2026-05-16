package com.javaweb.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.javaweb.domain.User;
import com.javaweb.domain.request.ReqGoogleLoginDTO;
import com.javaweb.domain.request.ReqLoginDTO;
import com.javaweb.domain.request.ReqRegisterDTO;
import com.javaweb.domain.response.ResLoginDTO;
import com.javaweb.domain.response.role.ResRoleDTO;
import com.javaweb.domain.response.user.ResCreateUserDTO;
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
// Nạp input gồm username/password vào Security
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDTO.getUsername(), loginDTO.getPassword());

        // xác thực người dùng => cần viết hàm loadUserByUsername
        Authentication authentication = authenticationManagerBuilder.getObject()
                .authenticate(authenticationToken);


        // set thông tin người dùng đăng nhập vào context (có thể sử dụng sau này)
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

        //create token
        String access_token = this.securityUtil.createAccessToken(authentication.getName(), resLoginDTO);
        resLoginDTO.setAccessToken(access_token);

        // create refresh token
        String refresh_token = this.securityUtil.createRefreshToken(loginDTO.getUsername(), resLoginDTO);

        //update token
        this.userService.updateUserToken(refresh_token, loginDTO.getUsername());

        // set cookies
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

        ResLoginDTO resLoginDTO = new ResLoginDTO();

        ResLoginDTO.UserLogin user =
                new ResLoginDTO.UserLogin();

        user.setEmail(email);
        user.setName(name);

        resLoginDTO.setUser(user);

        String accessToken = securityUtil.createAccessToken(email, resLoginDTO);

        resLoginDTO.setAccessToken(accessToken);

        // create refresh token
        String refresh_token = this.securityUtil.createRefreshToken(resLoginDTO.getUser().getName(), resLoginDTO);

        //update token
        this.userService.updateUserToken(refresh_token, resLoginDTO.getUser().getEmail());

        // set cookies
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
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount(){
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ?
                SecurityUtil.getCurrentUserLogin().get() : "";

        User currentUserDB = this.userService.getUserByUsername(email);
        ResLoginDTO resLoginDTO = new ResLoginDTO();
        ResLoginDTO.UserGetAccount userGetAccount = new ResLoginDTO.UserGetAccount();
        if (currentUserDB != null) {
            ResRoleDTO role = this.convertToRoleDTO(currentUserDB);
            ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                    currentUserDB.getId(),
                    currentUserDB.getEmail(),
                    currentUserDB.getFullName(),
                    role);
            resLoginDTO.setUser(userLogin);

            userGetAccount.setUser(userLogin);

        }
        return ResponseEntity.ok().body(userGetAccount);
    }

    @GetMapping("/auth/refresh")
    @ApiMessage("get user by refresh token")
    public ResponseEntity<ResLoginDTO> getRefeshToken(@CookieValue(name = "refresh_token", defaultValue = "abc") String refresh_token) throws IdInvalidException {
        if (refresh_token.equals("abc")) {
            throw new IdInvalidException("Bạn không có refresh token ở cookie");
        }

        // check valid
        Jwt decodedToken = this.securityUtil.checkValidRefreshToken(refresh_token);
        String email = decodedToken.getSubject();

        // check user by token + email
        User currentUser = this.userService.getUserByTokenAndEmail(refresh_token, email);
        if (currentUser == null) {
            throw new IdInvalidException("Refresh Token không hợp lệ");
        }

        // issue new token/set refresh token as cookies
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

        // create access token
        String access_token = this.securityUtil.createAccessToken(email, res);
        res.setAccessToken(access_token);

        // create refresh token
        String new_refresh_token = this.securityUtil.createRefreshToken(email, res);

        // update user
        this.userService.updateUserToken(new_refresh_token, email);

        // set cookies
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

        // update refresh token = null
        this.userService.updateUserToken(null, email);

        // remove refresh token cookie
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
}
