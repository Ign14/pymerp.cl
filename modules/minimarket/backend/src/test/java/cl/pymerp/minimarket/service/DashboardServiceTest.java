package cl.pymerp.minimarket.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import cl.pymerp.minimarket.api.DashboardResponse.LowStockItem;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.InventoryProjectionRepository;
import cl.pymerp.minimarket.repository.LocalSaleRepository;
import cl.pymerp.minimarket.repository.WebOrderRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class DashboardServiceTest {
  @Test
  void stockBajoSeExponeEnDashboard() {
    LocalSaleRepository localSaleRepository = Mockito.mock(LocalSaleRepository.class);
    WebOrderRepository webOrderRepository = Mockito.mock(WebOrderRepository.class);
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    InventoryProjectionRepository projectionRepository = Mockito.mock(InventoryProjectionRepository.class);

    LowStockItem item = LowStockItem.builder()
        .name("Azucar")
        .stockOnHand(1)
        .threshold(3)
        .build();

    when(projectionRepository.findLowStock()).thenReturn(List.of(item));
    when(webOrderRepository.findByStatusOrderByCreatedAtAsc(Mockito.any())).thenReturn(List.of());
    when(movementRepository.findTop10ByTypeOrderByCreatedAtDesc(Mockito.any())).thenReturn(List.of());
    when(localSaleRepository.findByCreatedAtBetween(Mockito.any(), Mockito.any())).thenReturn(List.of());

    DashboardService service = new DashboardService(
        localSaleRepository,
        webOrderRepository,
        movementRepository,
        projectionRepository);

    var response = service.getSummary();
    assertEquals(1, response.getLowStock().size());
    assertEquals("Azucar", response.getLowStock().get(0).getName());
  }
}
