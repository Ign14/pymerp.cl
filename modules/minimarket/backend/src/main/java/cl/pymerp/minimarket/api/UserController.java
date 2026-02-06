package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.security.UserPrincipal;
import cl.pymerp.minimarket.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping
  public List<UserResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
    requireAdmin(principal);
    return userService.list().stream().map(this::toResponse).collect(Collectors.toList());
  }

  @PostMapping
  public UserResponse create(
      @Valid @RequestBody UserRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    requireAdmin(principal);
    if (request.getPassword() == null || request.getPassword().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password requerido");
    }
    return toResponse(userService.create(request));
  }

  @PutMapping("/{id}")
  public UserResponse update(
      @PathVariable UUID id,
      @Valid @RequestBody UserRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    requireAdmin(principal);
    return toResponse(userService.update(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    requireAdmin(principal);
    userService.delete(id);
  }

  private void requireAdmin(UserPrincipal principal) {
    if (principal == null || principal.getRole() == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sin permisos");
    }
    if (!"ADMIN".equalsIgnoreCase(principal.getRole())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sin permisos");
    }
  }

  private UserResponse toResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .active(user.isActive())
        .createdAt(user.getCreatedAt())
        .build();
  }
}
