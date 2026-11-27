package com.famora.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.famora.common.exception.BusinessException;
import com.famora.common.exception.ErrorCode;
import com.famora.common.security.CurrentUser;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    /** The signed-in user's own profile. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return users.findById(CurrentUser.id(jwt))
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .map(UserResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));
    }
}
