package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "sale_type", nullable = false)
  private SaleType saleType;

  @Column(name = "reference_id", nullable = false)
  private UUID referenceId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentMethod method;

  @Column(nullable = false)
  private BigDecimal amount;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
