import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { request } = useAdminFetch();

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [query,      setQuery]      = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [cat,        setCat]        = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 20 });
    if (cat !== 'all')          params.set('cat', cat);
    if (debouncedQuery.trim()) params.set('q',   debouncedQuery.trim());
    try {
      const res = await request(`/api/admin/products?${params}`);
      if (!res) return;
      const json = await res.json();
      setProducts(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch {
      // listagem silenciosa
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, cat, request]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleAtivo = async (id) => {
    const res = await request(`/api/admin/products/${id}/ativo`, { method: 'PATCH' });
    if (!res) return;
    if (res.ok) {
      toast.success('Status atualizado');
      fetchProducts();
    } else {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-[800] text-ink">Produtos</h1>
          <p className="text-[13px] text-muted">{total} produtos no catálogo</p>
        </div>
        <button
          onClick={() => navigate('/admin/produtos/novo')}
          className="w-full md:w-auto bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors"
        >
          + Novo produto
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-4 py-2 text-[13px] w-full md:w-[220px] outline-none focus:border-orange"
        />
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange bg-white w-full md:w-auto"
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
          {/* Desktop: tabela */}
          <div className="hidden md:block bg-white rounded-[10px] border border-line overflow-hidden">
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

          {/* Mobile: cards */}
          <div className="md:hidden flex flex-col gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[10px] border border-line p-4">
                <div className="flex gap-3 mb-3">
                  {p.image && (
                    <img src={p.image} alt="" className="w-14 h-14 object-contain rounded border border-line flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-[700] text-ink truncate">{p.name}</p>
                    <p className="text-muted text-[12px] truncate">{p.tag}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-[12px] text-ink-light mb-3 flex-wrap">
                  <span><b className="text-ink">Cat:</b> {p.category_id}</span>
                  <span><b className="text-ink">Marca:</b> {p.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleAtivo(p.id)}
                    className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                      p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/produtos/${p.id}/editar`)}
                    className="text-orange font-[600] text-[13px]"
                  >
                    Editar →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 flex-wrap">
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
