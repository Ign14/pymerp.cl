package cl.pymerp.minimarket.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import cl.pymerp.minimarket.api.AdjustmentRequest;
import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.StockReservationRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class InventoryServiceTest {
  @Test
  void ajusteMermaNoPuedeDejarStockNegativo() {
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    StockReservationRepository reservationRepository = Mockito.mock(StockReservationRepository.class);

    InventoryService service = new InventoryService(
        movementRepository,
        productRepository,
        userRepository,
        reservationRepository);

    UUID productId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Product product = new Product();
    product.setId(productId);
    User user = new User();
    user.setId(userId);

    when(productRepository.findById(productId)).thenReturn(Optional.of(product));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(movementRepository.getStockOnHand(productId)).thenReturn(1L);

    AdjustmentRequest request = new AdjustmentRequest();
    request.setProductId(productId);
    request.setUserId(userId);
    request.setReason(MovementReason.merma);
    request.setQuantity(-5);

    assertThrows(IllegalArgumentException.class, () -> service.registerAdjustment(request));
  }

  @Test
  void ajusteRequiereMotivoValido() {
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    StockReservationRepository reservationRepository = Mockito.mock(StockReservationRepository.class);

    InventoryService service = new InventoryService(
        movementRepository,
        productRepository,
        userRepository,
        reservationRepository);

    AdjustmentRequest request = new AdjustmentRequest();
    request.setReason(MovementReason.compra);

    assertThrows(IllegalArgumentException.class, () -> service.registerAdjustment(request));
  }

  @Test
  void errorHumanoCantidadCeroEnAjuste() {
    InventoryMovementRepository movementRepository = Mockito.mock(InventoryMovementRepository.class);
    ProductRepository productRepository = Mockito.mock(ProductRepository.class);
    UserRepository userRepository = Mockito.mock(UserRepository.class);
    StockReservationRepository reservationRepository = Mockito.mock(StockReservationRepository.class);

    InventoryService service = new InventoryService(
        movementRepository,
        productRepository,
        userRepository,
        reservationRepository);

    AdjustmentRequest request = new AdjustmentRequest();
    request.setQuantity(0);
    request.setReason(MovementReason.ajuste);

    assertThrows(IllegalArgumentException.class, () -> service.registerAdjustment(request));
  }
}
