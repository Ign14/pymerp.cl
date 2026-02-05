package cl.pymerp.minimarket.api;

import cl.pymerp.minimarket.domain.LocalSale;
import cl.pymerp.minimarket.domain.LocalSaleItem;
import cl.pymerp.minimarket.security.UserPrincipal;
import cl.pymerp.minimarket.service.LocalSaleService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/local-sales")
public class LocalSaleController {
  private final LocalSaleService localSaleService;
  private final cl.pymerp.minimarket.repository.LocalSaleRepository localSaleRepository;

  public LocalSaleController(
      LocalSaleService localSaleService,
      cl.pymerp.minimarket.repository.LocalSaleRepository localSaleRepository) {
    this.localSaleService = localSaleService;
    this.localSaleRepository = localSaleRepository;
  }

  @PostMapping
  public LocalSaleResponse create(
      @Valid @RequestBody LocalSaleRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    if (request.getUserId() == null && principal != null) {
      request.setUserId(principal.getId());
    }
    LocalSale sale = localSaleService.create(request);
    return toResponse(sale);
  }

  @GetMapping("/{id}/receipt.pdf")
  @Transactional(readOnly = true)
  public ResponseEntity<byte[]> getReceiptPdf(@PathVariable UUID id) throws DocumentException {
    LocalSale sale = localSaleRepository.findById(id).orElseThrow();
    byte[] pdf = buildReceiptPdf(sale);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=receipt-" + id + ".pdf")
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  @GetMapping("/{id}/receipt.html")
  @Transactional(readOnly = true)
  public ResponseEntity<byte[]> getReceiptHtml(@PathVariable UUID id) {
    LocalSale sale = localSaleRepository.findById(id).orElseThrow();
    String html = buildReceiptHtml(sale);
    return ResponseEntity.ok()
        .contentType(MediaType.TEXT_HTML)
        .body(html.getBytes(StandardCharsets.UTF_8));
  }

  private LocalSaleResponse toResponse(LocalSale sale) {
    List<LocalSaleItemResponse> items = sale.getItems() == null
        ? List.of()
        : sale.getItems().stream().map(this::toItemResponse).collect(Collectors.toList());
    return LocalSaleResponse.builder()
        .id(sale.getId())
        .totalAmount(sale.getTotalAmount())
        .items(items)
        .createdAt(sale.getCreatedAt())
        .receiptUrl("/api/local-sales/" + sale.getId() + "/receipt.pdf")
        .build();
  }

  private LocalSaleItemResponse toItemResponse(LocalSaleItem item) {
    BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    return LocalSaleItemResponse.builder()
        .productId(item.getProduct().getId())
        .name(item.getProduct().getName())
        .quantity(item.getQuantity())
        .unitPrice(item.getUnitPrice())
        .lineTotal(lineTotal)
        .build();
  }

  private byte[] buildReceiptPdf(LocalSale sale) throws DocumentException {
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    Document document = new Document();
    PdfWriter.getInstance(document, output);
    document.open();

    Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
    Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

    document.add(new Paragraph("PyM-ERP Minimarket", titleFont));
    document.add(new Paragraph("Comprobante interno", normalFont));
    document.add(new Paragraph("Operacion: " + sale.getId(), normalFont));
    document.add(new Paragraph("Fecha: " + sale.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), normalFont));
    document.add(new Paragraph(" "));

    PdfPTable table = new PdfPTable(4);
    table.setWidthPercentage(100);
    table.addCell(new PdfPCell(new Phrase("Producto", normalFont)));
    table.addCell(new PdfPCell(new Phrase("Cant.", normalFont)));
    table.addCell(new PdfPCell(new Phrase("Precio", normalFont)));
    table.addCell(new PdfPCell(new Phrase("Total", normalFont)));

    List<LocalSaleItem> items = sale.getItems() == null ? List.of() : sale.getItems();
    for (LocalSaleItem item : items) {
      table.addCell(new Phrase(item.getProduct().getName(), normalFont));
      table.addCell(new Phrase(String.valueOf(item.getQuantity()), normalFont));
      table.addCell(new Phrase(item.getUnitPrice().toPlainString(), normalFont));
      BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
      table.addCell(new Phrase(lineTotal.toPlainString(), normalFont));
    }

    document.add(table);
    document.add(new Paragraph(" "));
    document.add(new Paragraph("Total: " + sale.getTotalAmount().toPlainString(), titleFont));
    document.add(new Paragraph("Preparado para integracion SII", normalFont));

    document.close();
    return output.toByteArray();
  }

  private String buildReceiptHtml(LocalSale sale) {
    StringBuilder html = new StringBuilder();
    html.append("<html><head><style>")
        .append("body{font-family:Arial,sans-serif;margin:24px;}")
        .append("table{width:100%;border-collapse:collapse;margin-top:12px;}")
        .append("th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;}")
        .append(".total{font-size:18px;font-weight:bold;margin-top:16px;}")
        .append("</style></head><body>")
        .append("<h2>PyM-ERP Minimarket</h2>")
        .append("<p>Comprobante interno</p>")
        .append("<p>Operacion: ").append(sale.getId()).append("</p>")
        .append("<p>Fecha: ").append(sale.getCreatedAt()).append("</p>")
        .append("<table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>");

    List<LocalSaleItem> items = sale.getItems() == null ? List.of() : sale.getItems();
    for (LocalSaleItem item : items) {
      BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
      html.append("<tr><td>").append(item.getProduct().getName()).append("</td>")
          .append("<td>").append(item.getQuantity()).append("</td>")
          .append("<td>").append(item.getUnitPrice()).append("</td>")
          .append("<td>").append(lineTotal).append("</td></tr>");
    }

    html.append("</tbody></table>")
        .append("<p class='total'>Total: ").append(sale.getTotalAmount()).append("</p>")
        .append("<p>Preparado para integracion SII</p>")
        .append("</body></html>");

    return html.toString();
  }
}
