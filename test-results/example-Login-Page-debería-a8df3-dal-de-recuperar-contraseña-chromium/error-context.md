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
    - generic [ref=e22]:
      - generic [ref=e24]:
        - button "Cambiar idioma" [ref=e25] [cursor=pointer]:
          - img "Spanish" [ref=e26]: 🇪🇸
        - button "Cambiar modo claro/oscuro" [ref=e27] [cursor=pointer]: 💡
      - heading "Iniciar sesión" [level=2] [ref=e28]
    - generic [ref=e29]:
      - generic [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]: Email
          - textbox "Email" [ref=e33]
        - generic [ref=e34]:
          - generic [ref=e35]: Contraseña
          - textbox "Contraseña" [ref=e36]
      - generic [ref=e37]:
        - button "Iniciar sesión" [ref=e38] [cursor=pointer]
        - button "common.backHome" [ref=e39] [cursor=pointer]
        - button "¿Olvidaste tu contraseña?" [ref=e41] [cursor=pointer]
```