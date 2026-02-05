package cl.pymerp.minimarket.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import cl.pymerp.minimarket.api.LocalSaleItemRequest;
import cl.pymerp.minimarket.api.LocalSaleRequest;
import cl.pymerp.minimarket.domain.PaymentMethod;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.LocalSaleRepository;
import cl.pymerp.minimarket.repository.PaymentRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class LocalSaleServiceTest {
  @Test
  void ventaLocalNoPermiteStockInsuficiente() {
    LocalSaleRepository saleRepository = Mockito.mock(LocalSaleRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    PaymentRepository paymentRepository = Mockito.mock(PaymentRepository.class);
    InventoryService inventoryService = Mockito.mock(InventoryService.class);

    LocalSaleService service = new LocalSaleService(
        saleRepository,
        productRepository,
        userRepository,
        movementRepository,
        paymentRepository,
        inventoryService);

    UUID productId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Product product = new Product();
    product.setId(productId);
    product.setName("Pan");
    product.setPrice(BigDecimal.valueOf(500));
    User user = new User();
    user.setId(userId);

    when(productRepository.findById(productId)).thenReturn(Optional.of(product));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(inventoryService.getStockOnHand(productId)).thenReturn(1L);
    when(inventoryService.getReserved(productId)).thenReturn(0L);

    LocalSaleItemRequest item = new LocalSaleItemRequest();
    item.setProductId(productId);
    item.setQuantity(3);

    LocalSaleRequest request = new LocalSaleRequest();
    request.setUserId(userId);
    request.setMethod(PaymentMethod.CASH);
    request.setItems(List.of(item));

    assertThrows(IllegalArgumentException.class, () -> service.create(request));
  }

  @Test
  void pedidoWebReservadoBloqueaVentaSimultanea() {
    LocalSaleRepository saleRepository = Mockito.mock(LocalSaleRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    PaymentRepository paymentRepository = Mockito.mock(PaymentRepository.class);
    InventoryService inventoryService = Mockito.mock(InventoryService.class);

    LocalSaleService service = new LocalSaleService(
        saleRepository,
        productRepository,
        userRepository,
        movementRepository,
        paymentRepository,
        inventoryService);

    UUID productId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Product product = new Product();
    product.setId(productId);
    product.setName("Leche");
    product.setPrice(BigDecimal.valueOf(1100));
    User user = new User();
    user.setId(userId);

    when(productRepository.findById(productId)).thenReturn(Optional.of(product));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(inventoryService.getStockOnHand(productId)).thenReturn(5L);
    when(inventoryService.getReserved(productId)).thenReturn(5L);

    LocalSaleItemRequest item = new LocalSaleItemRequest();
    item.setProductId(productId);
    item.setQuantity(1);

    LocalSaleRequest request = new LocalSaleRequest();
    request.setUserId(userId);
    request.setMethod(PaymentMethod.DEBIT);
    request.setItems(List.of(item));

    assertThrows(IllegalArgumentException.class, () -> service.create(request));
  }
}
