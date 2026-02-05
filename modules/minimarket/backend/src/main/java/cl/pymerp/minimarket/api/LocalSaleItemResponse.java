package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LocalSaleItemResponse {
  private UUID productId;
  private String name;
  private int quantity;
  private BigDecimal unitPrice;
  private BigDecimal lineTotal;
}
