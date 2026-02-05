package cl.pymerp.minimarket.service;

import cl.pymerp.minimarket.api.ProductRequest;
import cl.pymerp.minimarket.domain.Category;
import cl.pymerp.minimarket.domain.Product;
import cl.pymerp.minimarket.repository.ProductRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  public List<Product> list() {
    return productRepository.findAll();
  }

  @Transactional
  public Product create(ProductRequest request) {
    Product product = new Product();
    applyRequest(product, request);
    return productRepository.save(product);
  }

  @Transactional
  public Product update(UUID id, ProductRequest request) {
    Product product = productRepository.findById(id).orElseThrow();
    applyRequest(product, request);
    return productRepository.save(product);
  }

  private void applyRequest(Product product, ProductRequest request) {
    if (request.getCategoryId() != null) {
      Category category = new Category();
      category.setId(request.getCategoryId());
      product.setCategory(category);
    } else {
      product.setCategory(null);
    }
    product.setSku(request.getSku());
    product.setBarcode(request.getBarcode());
    product.setName(request.getName());
    product.setDescription(request.getDescription());
    product.setUnit(request.getUnit());
    product.setPrice(request.getPrice());
    product.setCost(request.getCost());
    product.setVisibleWeb(request.isVisibleWeb());
    product.setActive(request.isActive());
    product.setLowStockThreshold(request.getLowStockThreshold());
  }
}
