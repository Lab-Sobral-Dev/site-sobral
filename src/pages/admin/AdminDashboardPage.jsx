import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const navigate  = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [query,      setQuery]      = useState('');
  const [cat,        setCat]        = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 20 });
    if (cat !== 'all') params.set('cat', cat);
    if (query.trim())  params.set('q',   query.trim());

    fetch(`/api/admin/products?${params}`, { headers: authHeaders })
      .then(r => r.json())
      .then(json => {
        setProducts(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, query, cat, token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleAtivo = async (id) => {
    const res = await fetch(`/api/admin/products/${id}/ativo`, { method: 'PATCH', headers: authHeaders });
    if (res.status === 401) { logout(); navigate('/admin/login'); return; }
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[24px] font-[800] text-ink">Produtos</h1>
          <p className="text-[13px] text-muted">{total} produtos no catálogo</p>
        </div>
        <button
          onClick={() => navigate('/admin/produtos/novo')}
          className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors"
        >
          + Novo produto
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-4 py-2 text-[13px] w-[220px] outline-none focus:border-orange"
        />
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange bg-white"
        >
          <option value="all">Todas as categorias</option>
          {categories.filter(c => c.id !== 'all').map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-[14px]">Carregando...</div>
      ) : (
        <>
          <div className="bg-white rounded-[10px] border border-line overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-[#FAFAFA] text-left">
                  <th className="px-4 py-3 font-[700] text-ink-light">Produto</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Categoria</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Marca</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Status</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image && (
                          <img src={p.image} alt="" className="w-10 h-10 object-contain rounded border border-line flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-[600] text-ink">{p.name}</p>
                          <p className="text-muted text-[12px]">{p.tag}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-light">{p.category_id}</td>
                    <td className="px-4 py-3 text-ink-light">{p.brand}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAtivo(p.id)}
                        className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                          p.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/produtos/${p.id}/editar`)}
                        className="text-orange hover:underline font-[600]"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-[6px] border text-[13px] font-bold transition-all ${
                    page === n ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
