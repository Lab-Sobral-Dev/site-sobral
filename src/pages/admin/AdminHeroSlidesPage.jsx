import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { value: 'fundo',  label: 'Fundo'   },
  { value: 'logo',   label: 'Logo'    },
  { value: 'cta',    label: 'CTA'     },
  { value: 'ignore', label: 'Ignorar' },
];

function SortableSlide({ slide, onToggle, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span {...attributes} {...listeners} className="text-[#ccc] text-[20px] cursor-grab select-none">⠿</span>
      <img
        src={slide.image_url}
        alt=""
        className="w-14 h-10 object-cover rounded border border-line flex-shrink-0"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="flex-1 text-[13px] text-ink font-[600] truncate">{slide.image_url}</div>
      <span className={`text-[11px] font-[600] px-2 py-0.5 rounded-full flex-shrink-0 ${slide.animado ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
        {slide.animado ? 'Animado' : 'Estático'}
      </span>
      <button
        onClick={() => onEdit(slide.id)}
        className="px-3 py-1 rounded-full text-[12px] font-[600] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
      >
        Editar
      </button>
      <button
        onClick={() => onToggle(slide.id)}
        className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors flex-shrink-0 ${
          slide.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
        }`}
      >
        {slide.ativo ? 'Ativo' : 'Inativo'}
      </button>
      <button onClick={() => onDelete(slide.id, slide.image_url)} className="text-red-400 hover:underline text-[13px] font-[600] flex-shrink-0">
        Excluir
      </button>
    </div>
  );
}

function PsdModal({ layers, assignments, onAssign, onOpen, onClose, creating }) {
  const hasFundo = Object.values(assignments).includes('fundo');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[12px] w-full max-w-[680px] max-h-[80vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-[800] text-ink">Camadas do PSD</h2>
            <p className="text-[12px] text-muted mt-0.5">Atribua o papel de cada camada. "Fundo" é obrigatório.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-[22px] leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {layers.length === 0 ? (
            <p className="text-center text-muted text-[14px] py-8">Nenhuma camada foi extraída do arquivo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {layers.map((layer, i) => (
                <div key={i} className="border border-line rounded-[8px] overflow-hidden">
                  <div className="bg-gray-50 h-28 flex items-center justify-center">
                    <img
                      src={layer.url}
                      alt={layer.name}
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[12px] font-[600] text-ink truncate mb-1" title={layer.name}>{layer.name}</p>
                    <p className="text-[10px] text-muted mb-2">{layer.width}×{layer.height}px · x:{layer.x}% y:{layer.y}%</p>
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map(r => (
                        <button
                          key={r.value}
                          onClick={() => onAssign(i, r.value)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-[700] border transition-colors ${
                            assignments[i] === r.value
                              ? 'bg-orange text-white border-orange'
                              : 'bg-white text-muted border-line hover:border-orange hover:text-orange'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-[600] text-muted hover:text-ink">
            Cancelar
          </button>
          <button
            onClick={onOpen}
            disabled={!hasFundo || creating}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {creating ? 'Criando slide...' : 'Abrir no builder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const [slides,       setSlides]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [psdLayers,    setPsdLayers]    = useState([]);
  const [psdModal,     setPsdModal]     = useState(false);
  const [assignments,  setAssignments]  = useState({});
  const [psdUploading, setPsdUploading] = useState(false);
  const [creating,     setCreating]     = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const sensors     = useSensors(useSensor(PointerSensor));

  const fetchSlides = () => {
    setLoading(true);
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(setSlides)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex  = slides.findIndex(s => s.id === active.id);
    const newIndex  = slides.findIndex(s => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    const previous  = slides;
    setSlides(reordered);
    try {
      const res = await fetch('/api/admin/hero-slides/reorder', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map(s => s.id) }),
      });
      if (!res.ok) throw new Error('Falha ao reordenar');
    } catch {
      setSlides(previous);
    }
  };

  const handleToggle = async (id) => {
    const res = await fetch(`/api/admin/hero-slides/${id}/ativo`, { method: 'PATCH', headers: authHeaders });
    if (!res.ok) { alert('Erro ao alterar status.'); return; }
    fetchSlides();
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm(`Excluir slide "${url}"?`)) return;
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE', headers: authHeaders });
    if (!res.ok) { alert('Erro ao excluir slide.'); return; }
    fetchSlides();
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: data.url, ordem: slides.length + 1 }),
      });
      fetchSlides();
    } catch (err) {
      alert(`Erro ao enviar imagem: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePsdUpload = async (file) => {
    setPsdUploading(true);
    const fd = new FormData();
    fd.append('psd', file);
    try {
      const res  = await fetch('/api/admin/psd-import', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPsdLayers(data.layers);
      setAssignments(Object.fromEntries(data.layers.map((_, i) => [i, 'ignore'])));
      setPsdModal(true);
    } catch (err) {
      alert(`Erro ao processar PSD: ${err.message}`);
    } finally {
      setPsdUploading(false);
    }
  };

  const assign = (index, role) => {
    setAssignments(prev => {
      const next = { ...prev };
      if (role !== 'ignore') {
        Object.keys(next).forEach(k => { if (next[k] === role) next[k] = 'ignore'; });
      }
      next[index] = role;
      return next;
    });
  };

  const handleOpenBuilder = async () => {
    const fundoIdx = Object.keys(assignments).find(k => assignments[k] === 'fundo');
    if (fundoIdx == null) return;
    setCreating(true);
    try {
      const fundo = psdLayers[fundoIdx];
      const res = await fetch('/api/admin/hero-slides', {
        method:  'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_url: fundo.url, ordem: slides.length + 1 }),
      });
      if (!res.ok) throw new Error('Falha ao criar slide');
      const slide = await res.json();

      const logoIdx = Object.keys(assignments).find(k => assignments[k] === 'logo');
      const ctaIdx  = Object.keys(assignments).find(k => assignments[k] === 'cta');

      const psdImport = {};
      if (logoIdx != null) {
        const l = psdLayers[logoIdx];
        psdImport.logo = { image_url: l.url, x: l.x, y: l.y, width: l.width };
      }
      if (ctaIdx != null) {
        const c = psdLayers[ctaIdx];
        psdImport.cta = { x: c.x, y: c.y };
      }

      setPsdModal(false);
      navigate(`/admin/hero-slides/${slide.id}/editar`, { state: { psdImport } });
    } catch {
      alert('Erro ao criar slide.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-[700px]">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[24px] font-[800] text-ink">Hero Slides</h1>
        <div className="flex gap-2">
          <label className={`cursor-pointer border border-orange text-orange font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-orange-50 ${psdUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {psdUploading ? 'Processando...' : 'Importar PSD'}
            <input type="file" accept=".psd" className="hidden" onChange={e => { if (e.target.files[0]) { handlePsdUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
          <label className={`cursor-pointer bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? 'Enviando...' : '+ Novo slide'}
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { if (e.target.files[0]) { handleUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
        </div>
      </div>
      <p className="text-[13px] text-muted mb-6">Arraste para reordenar. Clique em "Editar" para abrir o builder.</p>

      {loading ? (
        <div className="py-10 text-center text-muted text-[14px]">Carregando...</div>
      ) : slides.length === 0 ? (
        <div className="py-10 text-center text-muted text-[14px]">Nenhum slide. Adicione o primeiro!</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {slides.map(slide => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={id => navigate(`/admin/hero-slides/${id}/editar`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {psdModal && (
        <PsdModal
          layers={psdLayers}
          assignments={assignments}
          onAssign={assign}
          onOpen={handleOpenBuilder}
          onClose={() => setPsdModal(false)}
          creating={creating}
        />
      )}
    </div>
  );
}
