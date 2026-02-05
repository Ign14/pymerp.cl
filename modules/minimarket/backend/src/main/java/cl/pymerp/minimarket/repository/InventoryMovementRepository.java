package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.MovementType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
  List<InventoryMovement> findByProductIdOrderByCreatedAtDesc(UUID productId);
  List<InventoryMovement> findTop10ByTypeOrderByCreatedAtDesc(MovementType type);

  @Query(
      "SELECT COALESCE(SUM(CASE "
          + "WHEN m.type = cl.pymerp.minimarket.domain.MovementType.IN THEN m.quantity "
          + "WHEN m.type = cl.pymerp.minimarket.domain.MovementType.OUT THEN -m.quantity "
          + "WHEN m.type = cl.pymerp.minimarket.domain.MovementType.ADJUST THEN m.quantity "
          + "ELSE 0 END), 0) "
          + "FROM InventoryMovement m WHERE m.product.id = :productId")
  long getStockOnHand(@Param("productId") UUID productId);
}
