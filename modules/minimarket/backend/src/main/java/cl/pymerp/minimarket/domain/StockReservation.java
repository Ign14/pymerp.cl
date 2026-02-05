package cl.pymerp.minimarket.domain;

import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "stock_reservations")
@Getter
@Setter
public class StockReservation {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @ManyToOne
  @JoinColumn(name = "web_order_id")
  private WebOrder webOrder;

  @Column(nullable = false)
  private int quantity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReservationStatus status = ReservationStatus.ACTIVE;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "expires_at")
  private OffsetDateTime expiresAt;
}
