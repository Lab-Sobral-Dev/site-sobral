import { useEffect, useState, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuemSomosPage from './pages/QuemSomosPage';
import ProdutosPage from './pages/ProdutosPage';
import ProdutoPage from './pages/ProdutoPage';
import FaleConoscoPage from './pages/FaleConoscoPage';
import PrivacidadePage from './pages/PrivacidadePage';
import MisturinhasPage from './pages/MisturinhasPage';

// Rotas admin carregadas sob demanda (TipTap, dnd-kit e editores pesados ficam
// em chunks separados que o visitante público nunca baixa).
const AdminLoginPage        = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout           = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage    = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductFormPage  = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminCategoriesPage   = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminContentPage      = lazy(() => import('./pages/admin/AdminContentPage'));
const AdminHeroSlidesPage   = lazy(() => import('./pages/admin/AdminHeroSlidesPage'));
const AdminSlideBuilderPage = lazy(() => import('./pages/admin/AdminSlideBuilderPage'));
const AdminMisturinhasPage  = lazy(() => import('./pages/admin/AdminMisturinhasPage'));

function AdminFallback() {
  return (
    <div className="min-h-screen grid place-items-center text-ink-light">
      Carregando…
    </div>
  );
}

// Envolve um elemento admin em Suspense para o carregamento sob demanda.
const admin = (el) => <Suspense fallback={<AdminFallback />}>{el}</Suspense>;

const DEFAULTS = {
  theme: 'orange-classic',
  typography: 'nunito',
  productCardStyle: 'pill-outline',
  heroVariant: 'split',
};

function Tweaks() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === 'orange-classic') {
      root.style.setProperty('--orange', '#F37021');
      root.style.setProperty('--orange-dark', '#E0580A');
      root.style.setProperty('--orange-light', '#F89B4D');
      root.style.setProperty('--orange-50', '#FFF4EB');
    } else if (config.theme === 'deep-clinical') {
      root.style.setProperty('--orange', '#0E6DAA');
      root.style.setProperty('--orange-dark', '#084E80');
      root.style.setProperty('--orange-light', '#3E9AD2');
      root.style.setProperty('--orange-50', '#EBF4FA');
    } else if (config.theme === 'nature-green') {
      root.style.setProperty('--orange', '#2E8540');
      root.style.setProperty('--orange-dark', '#1F5E2C');
      root.style.setProperty('--orange-light', '#5AAE6B');
      root.style.setProperty('--orange-50', '#EBF5ED');
    }
    if (config.typography === 'nunito') document.body.style.fontFamily = "'Nunito', system-ui, sans-serif";
    else if (config.typography === 'serif') document.body.style.fontFamily = "'Source Serif 4', Georgia, serif";
    else if (config.typography === 'dm-sans') document.body.style.fontFamily = "'DM Sans', system-ui, sans-serif";
    document.body.dataset.cardStyle = config.productCardStyle;
    document.body.dataset.heroVariant = config.heroVariant;
  }, [config]);

  const set = (key, val) => {
    const next = { ...config, [key]: val };
    setConfig(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  if (!visible) return null;

  const rows = [
    { label: 'Paleta', key: 'theme', options: [['orange-classic','Laranja clássico'],['deep-clinical','Azul clínico'],['nature-green','Verde natural']] },
    { label: 'Tipografia', key: 'typography', options: [['nunito','Nunito'],['dm-sans','DM Sans'],['serif','Serifada']] },
    { label: 'Card produto', key: 'productCardStyle', options: [['pill-outline','Pílula laranja'],['filled','Botão sólido'],['minimal','Minimalista']] },
    { label: 'Hero', key: 'heroVariant', options: [['split','Split laranja'],['bold','Gradiente amplo'],['clean','Clean']] },
  ];

  return (
    <div className="tweaks-panel">
      <h5 className="m-0 mb-3 text-[13px] font-[800] text-orange tracking-[.5px] uppercase">Tweaks</h5>
      {rows.map(row => (
        <div key={row.key} className="flex justify-between items-center py-2 border-b border-line gap-2.5 last:border-0">
          <label className="font-semibold text-ink-light">{row.label}</label>
          <select
            value={config[row.key]}
            onChange={(e) => set(row.key, e.target.value)}
            className="border border-line rounded-[6px] px-2 py-1 text-[12px] font-sans bg-white"
          >
            {row.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Layout() {
  const location = useLocation();
  return (
    <>
      <ScrollRestoration />
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" key={location.pathname} className="page-fade">
        <Outlet />
      </main>
      <Footer />
      <Tweaks />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,           element: <HomePage /> },
      { path: 'quem-somos',   element: <QuemSomosPage /> },
      { path: 'produtos',     element: <ProdutosPage /> },
      { path: 'produtos/:id', element: <ProdutoPage /> },
      { path: 'misturinhas',  element: <MisturinhasPage /> },
      { path: 'fale-conosco', element: <FaleConoscoPage /> },
      { path: 'privacidade',   element: <PrivacidadePage /> },
    ],
  },
  { path: '/admin/login', element: admin(<AdminLoginPage />) },
  {
    path: '/admin',
    element: admin(<AdminLayout />),
    children: [
      { index: true,                 element: admin(<AdminDashboardPage />) },
      { path: 'produtos/novo',       element: admin(<AdminProductFormPage />) },
      { path: 'produtos/:id/editar', element: admin(<AdminProductFormPage />) },
      { path: 'categorias',          element: admin(<AdminCategoriesPage />) },
      { path: 'conteudo/home',    element: admin(<AdminContentPage page="home" />) },
      { path: 'conteudo/sobre',   element: admin(<AdminContentPage page="sobre" />) },
      { path: 'conteudo/contato', element: admin(<AdminContentPage page="contato" />) },
      { path: 'misturinhas',                element: admin(<AdminMisturinhasPage />) },
      { path: 'hero-slides',                element: admin(<AdminHeroSlidesPage />) },
      { path: 'hero-slides/:id/editar',    element: admin(<AdminSlideBuilderPage />) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
