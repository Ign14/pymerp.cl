package cl.pymerp.minimarket.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LocalSaleResponse {
  private UUID id;
  private BigDecimal totalAmount;
  private List<LocalSaleItemResponse> items;
  private OffsetDateTime createdAt;
  private String receiptUrl;
}
