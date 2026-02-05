package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WebOrderItemResponse {
  private UUID productId;
  private int quantity;
  private BigDecimal unitPrice;
}
