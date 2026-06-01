import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';

const EMPTY_FORM = {
  id: '', name: '', tag: '', category_id: '', brand: '', image: '',
  description: '', caracteristicas: '', apresentacao: '', modo_uso: '',
  precaucoes: '', ingredientes: '', disclaimer: '', nutri_porcoes: '',
  nutri_rows: '', ativo: true, destaque: false,
};

export default function AdminProductFormPage() {
  const { id }  = useParams();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const { request } = useAdminFetch();

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [imageFile,  setImageFile]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    request(`/api/admin/products/${id}`)
      .then(r => r ? r.json() : Promise.reject())
      .then(p => {
        setForm({
          id:              p.id,
          name:            p.name            ?? '',
          tag:             p.tag             ?? '',
          category_id:     p.category_id     ?? '',
          brand:           p.brand           ?? '',
          image:           p.image           ?? '',
          description:     p.description     ?? '',
          caracteristicas: Array.isArray(p.caracteristicas)
            ? p.caracteristicas.join('\n')
            : (p.caracteristicas ?? ''),
          apresentacao:    p.apresentacao    ?? '',
          modo_uso:        p.modo_uso        ?? '',
          precaucoes:      p.precaucoes      ?? '',
          ingredientes:    p.ingredientes    ?? '',
          disclaimer:      p.disclaimer      ?? '',
          nutri_porcoes:   p.nutri_porcoes   ?? '',
          nutri_rows:      p.nutri_rows      ? JSON.stringify(p.nutri_rows, null, 2) : '',
          ativo:           p.ativo,
          destaque:        p.destaque ?? false,
        });
      })
      .catch(() => setError('Erro ao carregar produto.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', imageFile);
    try {
      const res  = await request('/api/upload', { method: 'POST', body: fd });
      if (!res) return null;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no upload.');
      return data.url;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    let imageUrl = form.image;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) { setSaving(false); return; }
      imageUrl = uploaded;
    }

    let nutriRows = undefined;
    if (form.nutri_rows.trim()) {
      try {
        nutriRows = JSON.parse(form.nutri_rows);
      } catch {
        setError('nutri_rows: JSON inválido.');
        setSaving(false);
        return;
      }
    }

    const body = {
      ...form,
      image:           imageUrl,
      caracteristicas: form.caracteristicas
        ? form.caracteristicas.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      nutri_rows:      nutriRows ?? null,
    };
    if (!isEdit) delete body.ativo;

    const url    = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res  = await request(url, { method, body: JSON.stringify(body) });
      if (!res) { setSaving(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      toast.success(isEdit ? 'Produto atualizado' : 'Produto criado');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted text-[14px]">Carregando produto...</div>;

  const field = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className="block text-[13px] font-[600] text-ink-light mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          rows={opts.rows || 3}
          className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange resize-y"
          placeholder={opts.placeholder}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => set(key, type === 'checkbox' ? e.target.checked : e.target.value)}
          disabled={opts.disabled}
          className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange disabled:bg-[#F5F5F5] disabled:text-muted"
          placeholder={opts.placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[860px]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="text-orange text-[13px] font-[600] hover:underline">
          ← Produtos
        </button>
        <h1 className="text-[22px] font-[800] text-ink">
          {isEdit ? 'Editar produto' : 'Novo produto'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {field('ID (slug)', 'id', 'text', { disabled: isEdit, placeholder: 'ex: calciolax-articule' })}
          {field('Nome *', 'name', 'text', { placeholder: 'Nome do produto' })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {field('Tag / subtítulo', 'tag', 'text', { placeholder: 'ex: Cálcio + Vitamina D 240ml' })}
          {field('Marca', 'brand', 'text', { placeholder: 'ex: Calciolax' })}
        </div>

        <div>
          <label className="block text-[13px] font-[600] text-ink-light mb-1">Categoria *</label>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            required
            className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange bg-white"
          >
            <option value="">Selecione...</option>
            {categories.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-[600] text-ink-light mb-1">Imagem</label>
          <div className="flex flex-col md:flex-row gap-3 md:items-start">
            <input
              type="text"
              value={form.image}
              onChange={e => set('image', e.target.value)}
              placeholder="/images/produtos/nome.png"
              className="flex-1 border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
            />
            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={e => {
                  const file = e.target.files[0] || null;
                  if (file && file.size > 20 * 1024 * 1024) {
                    setError('Imagem muito grande. Tamanho máximo: 20 MB.');
                    e.target.value = '';
                    return;
                  }
                  setError('');
                  setImageFile(file);
                }}
                className="text-[13px] text-ink-light"
              />
              {imageFile && (
                <p className="text-[12px] text-muted">{imageFile.name} — será enviado ao salvar</p>
              )}
            </div>
            {form.image && (
              <img src={form.image} alt="" className="w-16 h-16 object-contain rounded border border-line" />
            )}
          </div>
        </div>

        {field('Descrição', 'description', 'textarea', { rows: 3, placeholder: 'Descrição resumida do produto' })}
        {field('Características (1 por linha)', 'caracteristicas', 'textarea', { rows: 4, placeholder: 'Cada linha vira um item da lista' })}
        {field('Apresentação', 'apresentacao', 'textarea', { rows: 2 })}
        {field('Modo de uso', 'modo_uso', 'textarea', { rows: 2 })}
        {field('Precauções', 'precaucoes', 'textarea', { rows: 2 })}
        {field('Ingredientes', 'ingredientes', 'textarea', { rows: 3 })}
        {field('Disclaimer', 'disclaimer', 'textarea', { rows: 2 })}
        {field('Porções (nutri_porcoes)', 'nutri_porcoes', 'textarea', { rows: 2, placeholder: 'Porções por embalagem: 2\nPorção: 15ml' })}
        {field('Tabela nutricional — JSON (nutri_rows)', 'nutri_rows', 'textarea', {
          rows: 4,
          placeholder: '[["Vitamina C (mg)", "90", "90"], ["Magnésio (mg)", "104", "25"]]',
        })}

        {isEdit && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              className="w-4 h-4 accent-orange"
            />
            <label htmlFor="ativo" className="text-[14px] font-[600] text-ink">Produto ativo (visível no site)</label>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="destaque"
            checked={form.destaque}
            onChange={e => set('destaque', e.target.checked)}
            className="w-4 h-4 accent-orange"
          />
          <label htmlFor="destaque" className="text-[14px] font-[600] text-ink">Produto em destaque (aparece no carrossel da home)</label>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full md:w-auto bg-orange hover:bg-[#E0580A] text-white font-[700] px-6 py-2.5 rounded-[8px] text-[14px] transition-colors disabled:opacity-60"
          >
            {saving || uploading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full md:w-auto border border-line text-ink-light font-[600] px-6 py-2.5 rounded-[8px] text-[14px] hover:border-orange hover:text-orange transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
