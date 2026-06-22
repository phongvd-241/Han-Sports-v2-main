package com.javaweb.controller;

import com.javaweb.domain.User;
import com.javaweb.domain.request.ReqUserLockDTO;
import com.javaweb.domain.request.ReqUserCreateDTO;
import com.javaweb.domain.request.ReqUserUpdateDTO;
import com.javaweb.domain.response.ResultPaginationDTO;
import com.javaweb.domain.response.user.ResCreateUserDTO;
import com.javaweb.domain.response.user.ResUpdateUserDTO;
import com.javaweb.domain.response.user.ResUserDTO;
import com.javaweb.service.UserService;
import com.javaweb.util.SecurityUtil;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/users")
    @ApiMessage("create a user")
    public ResponseEntity<ResCreateUserDTO> createUser(@RequestBody @Valid ReqUserCreateDTO user) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(user));
    }

    @PutMapping("/users")
    @ApiMessage("update a user")
    public ResponseEntity<ResUpdateUserDTO> updateUser(@RequestBody @Valid ReqUserUpdateDTO user) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.OK).body(userService.updateUser(user));
    }

    @DeleteMapping("/users/{id}")
    @ApiMessage("delete a user")
    public ResponseEntity<Void> deleteUser(@PathVariable long id) throws IdInvalidException {
        if(!this.userService.isUserExists(id))
        {
            throw new IdInvalidException("User không tồn tại");
        }
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        this.userService.deleteUserById(id, email);
        return ResponseEntity.ok(null);
    }

    @PatchMapping("/users/{id}/locked")
    @ApiMessage("update user lock status")
    public ResponseEntity<ResUserDTO> updateUserLockStatus(@PathVariable long id,
                                                           @RequestBody @Valid ReqUserLockDTO req) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        return ResponseEntity.status(HttpStatus.OK)
                .body(this.userService.updateUserLockStatus(id, req.getLocked(), email));
    }

    @GetMapping("/users")
    @ApiMessage("get all users")
    public ResponseEntity<ResultPaginationDTO> getAllUsers(@Filter Specification<User> spec,
                                                           Pageable pageable){

        return ResponseEntity.status(HttpStatus.OK).body(this.userService.fetchAllUsers(spec, pageable));
    }

    @GetMapping("/users/{id}")
    @ApiMessage("get user by id")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable long id) throws IdInvalidException {
        if(!this.userService.isUserExists(id))
        {
            throw new IdInvalidException("User không tồn tại");
        }
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.getuserById(id));
    }

}
