package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.WebOrderItemRequest;
import cl.pymerp.minimarket.api.WebOrderRequest;
import cl.pymerp.minimarket.domain.InventoryMovement;
import cl.pymerp.minimarket.domain.MovementReason;
import cl.pymerp.minimarket.domain.MovementType;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.domain.ReservationStatus;
import cl.pymerp.minimarket.domain.StockReservation;
import cl.pymerp.minimarket.domain.User;
import cl.pymerp.minimarket.domain.WebOrder;
import cl.pymerp.minimarket.domain.WebOrderItem;
import cl.pymerp.minimarket.domain.WebOrderStatus;
import cl.pymerp.minimarket.repository.InventoryMovementRepository;
import cl.pymerp.minimarket.repository.ProductRepository;
import cl.pymerp.minimarket.repository.StockReservationRepository;
import cl.pymerp.minimarket.repository.UserRepository;
import cl.pymerp.minimarket.repository.WebOrderRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WebOrderService {
  private final WebOrderRepository webOrderRepository;
  private final ProductRepository productRepository;
  private final StockReservationRepository reservationRepository;
  private final InventoryMovementRepository movementRepository;
  private final UserRepository userRepository;
  private final InventoryService inventoryService;

  public WebOrderService(
      WebOrderRepository webOrderRepository,
      ProductRepository productRepository,
      StockReservationRepository reservationRepository,
      InventoryMovementRepository movementRepository,
      UserRepository userRepository,
      InventoryService inventoryService) {
    this.webOrderRepository = webOrderRepository;
    this.productRepository = productRepository;
    this.reservationRepository = reservationRepository;
    this.movementRepository = movementRepository;
    this.userRepository = userRepository;
    this.inventoryService = inventoryService;
  }

  @Transactional
  public WebOrder createOrder(WebOrderRequest request) {
    WebOrder order = new WebOrder();
    order.setCustomerName(request.getCustomerName());
    order.setCustomerPhone(request.getCustomerPhone());
    order.setCustomerEmail(request.getCustomerEmail());
    order.setStatus(WebOrderStatus.PENDING);

    List<WebOrderItem> items = new ArrayList<>();
    BigDecimal total = BigDecimal.ZERO;

    for (WebOrderItemRequest itemRequest : request.getItems()) {
      Product product = productRepository.findById(itemRequest.getProductId()).orElseThrow();
      long available = inventoryService.getStockOnHand(product.getId())
          - inventoryService.getReserved(product.getId());
      if (itemRequest.getQuantity() > available) {
        throw new IllegalArgumentException("stock insuficiente para producto: " + product.getName());
      }

      WebOrderItem item = new WebOrderItem();
      item.setWebOrder(order);
      item.setProduct(product);
      item.setQuantity(itemRequest.getQuantity());
      item.setUnitPrice(product.getPrice());
      items.add(item);

      total = total.add(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
    }

    order.setItems(items);
    order.setTotalAmount(total);

    WebOrder savedOrder = webOrderRepository.save(order);

    for (WebOrderItem item : items) {
      StockReservation reservation = new StockReservation();
      reservation.setProduct(item.getProduct());
      reservation.setWebOrder(savedOrder);
      reservation.setQuantity(item.getQuantity());
      reservation.setStatus(ReservationStatus.ACTIVE);
      reservationRepository.save(reservation);
    }

    return savedOrder;
  }

  @Transactional
  public WebOrder updateStatus(UUID orderId, WebOrderStatus status, UUID userId) {
    WebOrder order = webOrderRepository.findById(orderId).orElseThrow();

    if (order.getStatus() == WebOrderStatus.CANCELLED || order.getStatus() == WebOrderStatus.DELIVERED) {
      throw new IllegalArgumentException("pedido ya finalizado");
    }

    if (status == WebOrderStatus.DELIVERED) {
      if (userId == null) {
        throw new IllegalArgumentException("userId es obligatorio para entregar");
      }
      User user = userRepository.findById(userId).orElseThrow();
      consumeReservations(order, user);
    }

    if (status == WebOrderStatus.CANCELLED) {
      releaseReservations(order);
    }

    order.setStatus(status);
    return webOrderRepository.save(order);
  }

  private void consumeReservations(WebOrder order, User user) {
    List<StockReservation> reservations = reservationRepository
        .findByWebOrderIdAndStatus(order.getId(), ReservationStatus.ACTIVE);

    for (StockReservation reservation : reservations) {
      long stockOnHand = inventoryService.getStockOnHand(reservation.getProduct().getId());
      long projected = stockOnHand - reservation.getQuantity();
      if (projected < 0) {
        throw new IllegalArgumentException("stock insuficiente para entregar pedido");
      }

      InventoryMovement movement = new InventoryMovement();
      movement.setProduct(reservation.getProduct());
      movement.setType(MovementType.OUT);
      movement.setReason(MovementReason.venta);
      movement.setQuantity(reservation.getQuantity());
      movement.setNotes("Pedido web: " + order.getId());
      movement.setUser(user);
      movementRepository.save(movement);

      reservation.setStatus(ReservationStatus.CONSUMED);
      reservationRepository.save(reservation);
    }
  }

  private void releaseReservations(WebOrder order) {
    List<StockReservation> reservations = reservationRepository
        .findByWebOrderIdAndStatus(order.getId(), ReservationStatus.ACTIVE);

    for (StockReservation reservation : reservations) {
      reservation.setStatus(ReservationStatus.RELEASED);
      reservationRepository.save(reservation);
    }
  }
}
