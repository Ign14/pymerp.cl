package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.WebOrderStatus;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebOrderStatusRequest {
  @NotNull
  private WebOrderStatus status;

  private UUID userId;
}
