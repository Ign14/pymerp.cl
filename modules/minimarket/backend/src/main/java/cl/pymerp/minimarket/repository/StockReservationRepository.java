package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.ReservationStatus;
import cl.pymerp.minimarket.domain.StockReservation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {
  @Query("SELECT COALESCE(SUM(r.quantity), 0) FROM StockReservation r WHERE r.product.id = :productId AND r.status = :status")
  long sumByProductAndStatus(@Param("productId") UUID productId, @Param("status") ReservationStatus status);

  List<StockReservation> findByWebOrderIdAndStatus(UUID webOrderId, ReservationStatus status);
}
