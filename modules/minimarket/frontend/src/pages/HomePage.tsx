import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Abastecimiento',
    description: 'Ingresos, documentos, inventario, compras, historial y exportable.',
    path: '/minimarketerp/supply',
    icon: '📦',
  },
  {
    title: 'Venta Sucursal',
    description: 'Catálogo activos, POS, descuentos y descuento de inventario.',
    path: '/minimarketerp/pos',
    icon: '🛒',
  },
  {
    title: 'Pedidos Web',
    description: 'Productos activos web, estados: solicitado, recibido, reservado, pagado, cancelado.',
    path: '/minimarketerp/web-orders',
    icon: '🌐',
  },
];

export default function HomePage() {
  return (
    <section className="home-grid" style={{ marginTop: 0 }}>
      {cards.map((card) => (
        <Link
          key={card.path}
          to={card.path}
          className="home-card home-card-link"
        >
          <span className="home-card-icon" aria-hidden="true">
            {card.icon}
          </span>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </Link>
      ))}
    </section>
  );
}
