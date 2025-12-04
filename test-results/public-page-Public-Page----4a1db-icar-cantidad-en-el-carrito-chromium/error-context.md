# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation "Enlaces de navegación rápida":
    - link "Saltar al contenido principal" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - link "Saltar a la navegación" [ref=e4] [cursor=pointer]:
      - /url: "#navigation"
    - link "Saltar al pie de página" [ref=e5] [cursor=pointer]:
      - /url: "#footer"
  - generic [ref=e8]:
    - img [ref=e10]
    - generic [ref=e12]:
      - heading "App lista para usar offline" [level=4] [ref=e13]
      - paragraph [ref=e14]: La aplicación está lista para funcionar sin conexión.
    - button "Cerrar" [ref=e16] [cursor=pointer]:
      - img [ref=e17]
  - generic [ref=e21]:
    - heading "Emprendimiento no encontrado" [level=1] [ref=e22]
    - paragraph [ref=e23]: La página que buscas no existe.
```