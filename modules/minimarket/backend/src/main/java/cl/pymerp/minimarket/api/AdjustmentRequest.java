package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.MovementReason;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdjustmentRequest {
  @NotNull
  private UUID productId;

  @NotNull
  private Integer quantity;

  @NotNull
  private MovementReason reason;

  private String notes;

  private UUID userId;
}
