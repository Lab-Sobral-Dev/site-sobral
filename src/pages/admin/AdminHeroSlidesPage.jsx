import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';

function SortableSlide({ slide, onToggle, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const layerCount = Array.isArray(slide.layers) ? slide.layers.length : 0;
  const thumb = slide.image_url || (slide.layers?.find(l => l.type === 'image')?.url) || '';

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span {...attributes} {...listeners} className="text-[#ccc] text-[20px] cursor-grab select-none">⠿</span>
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="w-14 h-10 object-cover rounded border border-line flex-shrink-0"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div className="w-14 h-10 rounded border border-line flex-shrink-0 bg-gray-100" />
      )}
      <div className="flex-1 text-[13px] text-ink font-[600] truncate">
        Slide #{slide.id} · {layerCount} {layerCount === 1 ? 'camada' : 'camadas'}
      </div>
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
      <button onClick={() => onDelete(slide.id)} className="text-red-400 hover:underline text-[13px] font-[600] flex-shrink-0">
        Excluir
      </button>
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const [slides,       setSlides]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [psdUploading, setPsdUploading] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const sensors     = useSensors(useSensor(PointerSensor));

  const fetchSlides = () => {
    setLoading(true);
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(data => setSlides(Array.isArray(data) ? data : []))
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

  const handleDelete = async (id) => {
    if (!window.confirm(`Excluir slide #${id}?`)) return;
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
      const layers = [{
        id: crypto.randomUUID(),
        type: 'image',
        name: 'fundo',
        url: data.url,
        x: 0, y: 0, width: 1920, height: 600,
        visible: true,
        animation: null,
      }];
      const create = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: data.url, ordem: slides.length + 1, layers }),
      });
      if (!create.ok) throw new Error('Falha ao criar slide.');
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
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const layers = data.layers || [];
      const bg = layers.find(l => l.name === 'fundo' && l.type === 'image');
      const create = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: bg?.url || '', ordem: slides.length + 1, layers }),
      });
      if (!create.ok) throw new Error('Falha ao criar slide.');
      const slide = await create.json();
      navigate(`/admin/hero-slides/${slide.id}/editar`);
    } catch (err) {
      alert(`Erro ao processar PSD: ${err.message}`);
    } finally {
      setPsdUploading(false);
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
    </div>
  );
}
