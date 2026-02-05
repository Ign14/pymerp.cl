package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.PaymentMethod;
import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocalSaleRequest {
  private UUID userId;

  @Valid
  @NotEmpty
  private List<LocalSaleItemRequest> items;

  @NotNull
  private PaymentMethod method;
}
