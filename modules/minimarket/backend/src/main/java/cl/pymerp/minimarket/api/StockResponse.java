package cl.pymerp.minimarket.api;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockResponse {
  private UUID productId;
  private long stockOnHand;
  private long reserved;
  private long available;
}
