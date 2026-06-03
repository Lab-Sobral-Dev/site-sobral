import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import ConfirmModal from '../../components/admin/ConfirmModal';

const EMPTY_FORM = { titulo: '', categoria: '', aplicacao: '', resultado: '', ingredientes: [], ordem: 0 };
const EMPTY_ING  = { product_id: '', nome: '', qty: '' };

export default function AdminMisturinhasPage() {
  const { request } = useAdminFetch();

  const [misturinhas, setMisturinhas] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [form,        setForm]        = useState(null);  // null = lista, objeto = formulário
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [confirm,     setConfirm]     = useState(null);

  const categories = [...new Set(misturinhas.map(m => m.categoria))].sort();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await request('/api/admin/misturinhas');
      if (!res) return;
      setMisturinhas(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    fetch('/api/products?per_page=100')
      .then(r => r.json())
      .then(j => setAllProducts(j.data || []))
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setError(''); };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({
      titulo:      m.titulo,
      categoria:   m.categoria,
      aplicacao:   m.aplicacao  || '',
      resultado:   m.resultado  || '',
      ingredientes: Array.isArray(m.ingredientes) ? m.ingredientes.map(i => ({ ...i })) : [],
      ordem:       m.ordem,
      ativo:       m.ativo,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addIng = () => setForm(f => ({ ...f, ingredientes: [...f.ingredientes, { ...EMPTY_ING }] }));

  const setIng = (i, key, val) => setForm(f => {
    const ings = [...f.ingredientes];
    ings[i] = { ...ings[i], [key]: val };
    if (key === 'product_id') {
      const p = allProducts.find(p => p.id === val);
      ings[i].nome = p?.name || '';
    }
    return { ...f, ingredientes: ings };
  });

  const removeIng = (i) => setForm(f => ({
    ...f,
    ingredientes: f.ingredientes.filter((_, j) => j !== i),
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      ...form,
      ingredientes: form.ingredientes.filter(i => i.product_id),
      ordem: Number(form.ordem) || 0,
    };
    try {
      const url    = editId ? `/api/admin/misturinhas/${editId}` : '/api/admin/misturinhas';
      const method = editId ? 'PUT' : 'POST';
      const res = await request(url, { method, body: JSON.stringify(body) });
      if (!res) { setSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      toast.success(editId ? 'Misturinha atualizada' : 'Misturinha criada');
      setForm(null);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    const res = await request(`/api/admin/misturinhas/${id}/ativo`, { method: 'PATCH' });
    if (res?.ok) { toast.success('Status atualizado'); fetchAll(); }
    else toast.error('Erro ao atualizar status.');
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const { id, titulo } = confirm;
    setConfirm(null);
    const res = await request(`/api/admin/misturinhas/${id}`, { method: 'DELETE' });
    if (res?.ok) { toast.success(`"${titulo}" removida`); fetchAll(); }
    else toast.error('Erro ao remover.');
  };

  const grouped = misturinhas.reduce((acc, m) => {
    (acc[m.categoria] = acc[m.categoria] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-[800px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-[800] text-ink">Misturinhas</h1>
        {!form && (
          <button onClick={openCreate} className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors">
            + Nova misturinha
          </button>
        )}
      </div>

      {/* Formulário */}
      {form && (
        <div className="bg-white border border-line rounded-[10px] p-5 mb-8">
          <h2 className="text-[16px] font-[700] text-ink mb-4">{editId ? 'Editar misturinha' : 'Nova misturinha'}</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_60px] gap-3">
              <div>
                <label className="block text-[12px] font-[600] text-ink-light mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setF('titulo', e.target.value)} required
                  className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange" />
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-ink-light mb-1">Categoria *</label>
                <input value={form.categoria} onChange={e => setF('categoria', e.target.value)} required
                  list="cats-list" placeholder="ex: cabelo"
                  className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange" />
                <datalist id="cats-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-ink-light mb-1">Ordem</label>
                <input type="number" value={form.ordem} onChange={e => setF('ordem', e.target.value)}
                  className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Como aplicar</label>
              <textarea value={form.aplicacao} onChange={e => setF('aplicacao', e.target.value)} rows={3}
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange resize-y" />
            </div>

            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">O resultado</label>
              <textarea value={form.resultado} onChange={e => setF('resultado', e.target.value)} rows={2}
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange resize-y" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-[600] text-ink-light">Ingredientes</label>
                <button type="button" onClick={addIng} className="text-[12px] font-[700] text-orange hover:underline">
                  + Adicionar
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {form.ingredientes.map((ing, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                    <select
                      value={ing.product_id}
                      onChange={e => setIng(i, 'product_id', e.target.value)}
                      className="border border-line rounded-[8px] px-2 py-1.5 text-[13px] outline-none focus:border-orange bg-white"
                    >
                      <option value="">Selecione o produto</option>
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Quantidade"
                      value={ing.qty}
                      onChange={e => setIng(i, 'qty', e.target.value)}
                      className="border border-line rounded-[8px] px-2 py-1.5 text-[13px] outline-none focus:border-orange"
                    />
                    <button type="button" onClick={() => removeIng(i)}
                      className="w-8 h-8 text-red-400 hover:text-red-600 text-[18px] flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
                {form.ingredientes.length === 0 && (
                  <p className="text-[12px] text-muted">Nenhum ingrediente. Clique em "+ Adicionar".</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[13px] disabled:opacity-60 transition-colors">
                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Criar'}
              </button>
              <button type="button" onClick={() => setForm(null)}
                className="border border-line text-ink-light font-[600] px-5 py-2.5 rounded-[8px] text-[13px] hover:border-orange hover:text-orange transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-muted text-[14px]">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-muted text-[14px]">Nenhuma misturinha cadastrada.</div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <div className="text-[11px] font-[700] text-orange tracking-[.6px] uppercase mb-3 capitalize">{cat}</div>
            <div className="flex flex-col gap-2">
              {items.map(m => (
                <div key={m.id} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`font-[600] text-[14px] ${m.ativo ? 'text-ink' : 'text-muted line-through'}`}>{m.titulo}</p>
                    <p className="text-[12px] text-muted">
                      {(m.ingredientes || []).map(i => i.nome || i.product_id).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(m.id)}
                      className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                        m.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}>
                      {m.ativo ? 'Ativa' : 'Inativa'}
                    </button>
                    <button onClick={() => openEdit(m)} className="text-orange hover:underline font-[600] text-[13px]">Editar</button>
                    <button onClick={() => setConfirm({ id: m.id, titulo: m.titulo })} className="text-red-400 hover:underline font-[600] text-[13px]">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <ConfirmModal
        open={!!confirm}
        title="Excluir misturinha"
        message={`Tem certeza que deseja excluir "${confirm?.titulo}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
