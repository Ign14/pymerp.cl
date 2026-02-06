package cl.pymerp.minimarket.api;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
  private UUID id;
  private String email;
  private String fullName;
  private String role;
  private boolean active;
  private OffsetDateTime createdAt;
}
