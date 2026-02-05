package cl.pymerp.minimarket.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "local_sales")
@Getter
@Setter
public class LocalSale {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "total_amount", nullable = false)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SaleStatus status = SaleStatus.COMPLETED;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @OneToMany(mappedBy = "localSale", cascade = CascadeType.ALL)
  private List<LocalSaleItem> items;
}
