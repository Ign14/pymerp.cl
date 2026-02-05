package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.MovementType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MovementResponse {
  private UUID id;
  private UUID productId;
  private MovementType type;
  private MovementReason reason;
  private int quantity;
  private String documentType;
  private String documentNumber;
  private String notes;
  private UUID userId;
  private OffsetDateTime createdAt;
}
