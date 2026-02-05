package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.WebOrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WebOrderResponse {
  private UUID id;
  private String customerName;
  private String customerPhone;
  private String customerEmail;
  private WebOrderStatus status;
  private BigDecimal totalAmount;
  private List<WebOrderItemResponse> items;
}
