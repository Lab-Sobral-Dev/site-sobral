import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';

export default function AdminCategoriesPage() {
  const { request } = useAdminFetch();

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newId,      setNewId]      = useState('');
  const [newLabel,   setNewLabel]   = useState('');
  const [newOrdem,   setNewOrdem]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res  = await request('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ id: newId.trim(), label: newLabel.trim(), ordem: Number(newOrdem) || 99 }),
      });
      if (!res) { setSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar.');
      toast.success(`Categoria "${newLabel.trim()}" criada`);
      setNewId(''); setNewLabel(''); setNewOrdem('');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Remover categoria "${label}"? Só é possível se não houver produtos vinculados.`)) return;
    try {
      const res  = await request(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover.');
      toast.success(`Categoria "${label}" removida`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-[640px]">
      <h1 className="text-[24px] font-[800] text-ink mb-6">Categorias</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-line rounded-[10px] p-5 mb-6">
        <h2 className="text-[15px] font-[700] text-ink mb-4">Nova categoria</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_2fr_80px] gap-3">
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">ID (slug)</label>
              <input
                value={newId}
                onChange={e => setNewId(e.target.value)}
                required
                placeholder="ex: fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Label</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                required
                placeholder="ex: Fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Ordem</label>
              <input
                type="number"
                value={newOrdem}
                onChange={e => setNewOrdem(e.target.value)}
                placeholder="99"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Criando...' : '+ Criar'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-muted text-[14px]">Carregando...</div>
      ) : (
        <div className="bg-white border border-line rounded-[10px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-[#FAFAFA] text-left">
                <th className="px-4 py-3 font-[700] text-ink-light">ID</th>
                <th className="px-4 py-3 font-[700] text-ink-light">Label</th>
                <th className="px-4 py-3 font-[700] text-ink-light">Ordem</th>
                <th className="px-4 py-3 font-[700] text-ink-light"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3 font-mono text-ink-light">{c.id}</td>
                  <td className="px-4 py-3 font-[600] text-ink">{c.label}</td>
                  <td className="px-4 py-3 text-ink-light">{c.ordem}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id, c.label)}
                      className="text-red-400 hover:underline font-[600]"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
