import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuemSomosPage from './pages/QuemSomosPage';
import ProdutosPage from './pages/ProdutosPage';
import ProdutoPage from './pages/ProdutoPage';
import FaleConoscoPage from './pages/FaleConoscoPage';
import PrivacidadePage from './pages/PrivacidadePage';
import MedicamentosPage from './pages/MedicamentosPage';
import AdminLoginPage        from './pages/admin/AdminLoginPage';
import AdminLayout           from './pages/admin/AdminLayout';
import AdminDashboardPage    from './pages/admin/AdminDashboardPage';
import AdminProductFormPage  from './pages/admin/AdminProductFormPage';
import AdminCategoriesPage   from './pages/admin/AdminCategoriesPage';
import AdminContentPage    from './pages/admin/AdminContentPage';
import AdminHeroSlidesPage from './pages/admin/AdminHeroSlidesPage';

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
  return (
    <>
      <ScrollRestoration />
      <Header />
      <main><Outlet /></main>
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
      { path: 'fale-conosco', element: <FaleConoscoPage /> },
      { path: 'privacidade',   element: <PrivacidadePage /> },
      { path: 'medicamentos',  element: <MedicamentosPage /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true,                 element: <AdminDashboardPage /> },
      { path: 'produtos/novo',       element: <AdminProductFormPage /> },
      { path: 'produtos/:id/editar', element: <AdminProductFormPage /> },
      { path: 'categorias',          element: <AdminCategoriesPage /> },
      { path: 'conteudo/home',    element: <AdminContentPage page="home" /> },
      { path: 'conteudo/sobre',   element: <AdminContentPage page="sobre" /> },
      { path: 'conteudo/contato', element: <AdminContentPage page="contato" /> },
      { path: 'hero-slides',      element: <AdminHeroSlidesPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
