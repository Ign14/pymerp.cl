package cl.pymerp.minimarket.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import cl.pymerp.minimarket.api.WebOrderItemRequest;
import cl.pymerp.minimarket.api.WebOrderRequest;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.StockReservationRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import cl.pymerp.minimarket.repository.WebOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class WebOrderServiceTest {
  @Test
  void pedidoWebNoPermiteSobreventa() {
    WebOrderRepository webOrderRepository = Mockito.mock(WebOrderRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    StockReservationRepository reservationRepository = Mockito.mock(StockReservationRepository.class);
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    InventoryService inventoryService = Mockito.mock(InventoryService.class);

    WebOrderService service = new WebOrderService(
        webOrderRepository,
        productRepository,
        reservationRepository,
        movementRepository,
        userRepository,
        inventoryService);

    UUID productId = UUID.randomUUID();
    Product product = new Product();
    product.setId(productId);
    product.setName("Arroz");
    product.setPrice(BigDecimal.valueOf(1200));

    when(productRepository.findById(productId)).thenReturn(Optional.of(product));
    when(inventoryService.getStockOnHand(productId)).thenReturn(1L);
    when(inventoryService.getReserved(productId)).thenReturn(0L);

    WebOrderItemRequest item = new WebOrderItemRequest();
    item.setProductId(productId);
    item.setQuantity(5);

    WebOrderRequest request = new WebOrderRequest();
    request.setCustomerName("Cliente");
    request.setCustomerPhone("+56900000000");
    request.setItems(List.of(item));

    assertThrows(IllegalArgumentException.class, () -> service.createOrder(request));
  }
}
