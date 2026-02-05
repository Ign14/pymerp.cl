package cl.pymerp.minimarket.api;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
  private String token;
  private UUID userId;
  private String fullName;
  private String role;
}
