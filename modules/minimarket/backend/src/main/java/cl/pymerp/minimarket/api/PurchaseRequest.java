package cl.pymerp.minimarket.api;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseRequest {
  @NotNull
  private UUID productId;

  @NotNull
  @Positive
  private Integer quantity;

  @NotBlank
  private String documentType;

  @NotBlank
  private String documentNumber;

  private String notes;

  private UUID userId;
}
