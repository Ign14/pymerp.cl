import { Link, useNavigate } from 'react-router-dom';

const cards = [
  {
    title: 'Lista de productos',
    description: 'Ver y gestionar el catálogo de productos del inventario.',
    path: '/minimarketerp/supply/products',
    icon: '📋',
  },
  {
    title: 'Registrar Ingreso',
    description: 'Registrar ingresos de compra con documento y cantidad.',
    path: '/minimarketerp/supply/ingreso',
    icon: '📥',
  },
  {
    title: 'Inventario (+/-)',
    description: 'Ajustes de inventario: merma, vencimiento, descuento.',
    path: '/minimarketerp/supply/inventario',
    icon: '📊',
  },
  {
    title: 'Documentos',
    description: 'Historial de ingresos y documento exportable.',
    path: '/minimarketerp/supply/documentos',
    icon: '📄',
  },
];

export default function SupplyHomePage() {
  const navigate = useNavigate();
  return (
    <section className="supply-home">
      <div className="section-header">
        <div>
          <h2>Abastecimiento</h2>
          <p>Elige una opción para continuar.</p>
        </div>
        <button type="button" className="ghost" onClick={() => navigate('/minimarketerp')}>
          Volver
        </button>
      </div>
      <div className="home-grid" style={{ marginTop: 0 }}>
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
      </div>
    </section>
  );
}
