package cl.pymerp.minimarket.repository;

import cl.pymerp.minimarket.domain.WebOrder;
import cl.pymerp.minimarket.domain.WebOrderStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebOrderRepository extends JpaRepository<WebOrder, UUID> {
  List<WebOrder> findByStatusOrderByCreatedAtAsc(WebOrderStatus status);
  List<WebOrder> findAllByOrderByCreatedAtDesc();
}
