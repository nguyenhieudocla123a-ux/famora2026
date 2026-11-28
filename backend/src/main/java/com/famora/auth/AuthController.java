package com.famora.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.famora.auth.dto.GoogleLoginRequest;
import com.famora.auth.dto.LoginRequest;
import com.famora.auth.dto.RefreshRequest;
import com.famora.auth.dto.RegisterRequest;
import com.famora.auth.dto.TokenResponse;
import com.famora.auth.google.GoogleAuthService;
import com.famora.common.security.CurrentUser;
import com.famora.user.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final GoogleAuthService google;

    public AuthController(AuthService auth, GoogleAuthService google) {
        this.auth = auth;
        this.google = google;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    /** "Tiếp tục với Google": an ID token from the Google SDK in, a Famora token pair out. */
    @PostMapping("/google")
    public TokenResponse google(@Valid @RequestBody GoogleLoginRequest req) {
        return google.signIn(req.idToken());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return auth.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RefreshRequest req) {
        auth.logout(CurrentUser.id(jwt), req.refreshToken());
    }
}
