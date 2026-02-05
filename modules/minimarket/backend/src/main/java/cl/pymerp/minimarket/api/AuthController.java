package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.security.JwtService;
import cl.pymerp.minimarket.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  public AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody AuthRequest request) {
    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
    UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

    return AuthResponse.builder()
        .token(jwtService.generateToken(principal))
        .userId(principal.getId())
        .fullName(principal.getFullName())
        .role(principal.getRole())
        .build();
  }

  @GetMapping("/me")
  public AuthResponse me(@AuthenticationPrincipal UserPrincipal principal) {
    return AuthResponse.builder()
        .userId(principal.getId())
        .fullName(principal.getFullName())
        .role(principal.getRole())
        .build();
  }
}
