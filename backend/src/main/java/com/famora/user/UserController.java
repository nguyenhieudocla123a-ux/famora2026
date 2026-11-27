package com.famora.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.famora.common.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    /** The signed-in user's own profile. */
    @GetMapping
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return users.me(CurrentUser.id(jwt));
    }

    @PutMapping
    public UserResponse update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest req) {
        return users.updateProfile(CurrentUser.id(jwt), req);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest req) {
        users.changePassword(CurrentUser.id(jwt), req);
    }
}
