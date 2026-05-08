import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CANVAS_W = 1920;
const CANVAS_H = 600;

const ANIMATION_OPTS = [
  { value: '',            label: 'Nenhuma'     },
  { value: 'fade',        label: 'Fade'        },
  { value: 'slide-up',    label: '↑ Slide Up'  },
  { value: 'slide-left',  label: '← Slide Esq.'},
  { value: 'slide-right', label: '→ Slide Dir.'},
];

export default function AdminSlideBuilderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();

  const canvasRef = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(slides => {
        const s = slides.find(sl => sl.id === parseInt(id));
        if (!s) { navigate('/admin/hero-slides'); return; }
        setSlide(s);
        setLayers(Array.isArray(s.layers) ? s.layers : []);
      })
      .catch(() => navigate('/admin/hero-slides'));
  }, [id, authHeaders, navigate]);

  const updateLayer = useCallback((layerId, patch) => {
    setLayers(ls => ls.map(l => l.id === layerId ? { ...l, ...patch } : l));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method:  'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ layers }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      navigate('/admin/hero-slides');
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;

  // Lista é exibida do topo (último do array = z-index maior) para baixo.
  const reversedLayers = [...layers].reverse();
  const selected = layers.find(l => l.id === selectedId) || null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PAINEL ESQUERDO — LISTA DE CAMADAS ── */}
      <div className="w-[220px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Camadas ({layers.length})
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {reversedLayers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-[12px]">
              Nenhuma camada. Importe um PSD para começar.
            </div>
          ) : reversedLayers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setSelectedId(layer.id)}
              className={`w-full px-4 py-2 flex items-center gap-2 text-left ${
                selectedId === layer.id ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-[14px]">{layer.type === 'button' ? '🔘' : '🖼'}</span>
              <span className="text-[12px] font-[600] text-ink flex-1 truncate">{layer.name || 'Camada'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CANVAS CENTRAL ── */}
      <div className="flex-1 flex flex-col bg-[#e5e7eb] min-w-0">
        <div className="bg-[#1f2937] px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-white/40 flex-1 truncate">Slide #{slide.id}</span>
          <button
            onClick={() => setPreview(true)}
            className="text-white/80 hover:text-white border border-white/20 px-3 py-1 rounded-[6px] text-[12px] font-[600]"
          >
            Pré-visualizar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-1.5 rounded-[7px] text-[12px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/admin/hero-slides')}
            className="text-white/50 hover:text-white text-[12px] font-[600]"
          >
            Cancelar
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div
            ref={canvasRef}
            className="relative w-full max-w-[960px] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            onPointerDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
            {layers.filter(l => l.visible).map((layer) => {
              const style = {
                position: 'absolute',
                left:   `${(layer.x / CANVAS_W) * 100}%`,
                top:    `${(layer.y / CANVAS_H) * 100}%`,
                width:  `${(layer.width  / CANVAS_W) * 100}%`,
                height: `${(layer.height / CANVAS_H) * 100}%`,
              };
              const isSel = layer.id === selectedId;
              const ringClass = isSel ? 'outline outline-2 outline-blue-500' : '';

              if (layer.type === 'image') {
                return (
                  <img
                    key={layer.id}
                    src={layer.url}
                    alt={layer.name || ''}
                    style={style}
                    draggable={false}
                    className={`cursor-move ${ringClass}`}
                    onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
                  />
                );
              }
              return (
                <div
                  key={layer.id}
                  style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
                  className={`flex items-center justify-center rounded-lg font-bold text-sm cursor-move ${ringClass}`}
                  onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
                >
                  {layer.text || 'Botão'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — PROPRIEDADES (vazio nesta task) ── */}
      <div className="w-[260px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Propriedades
        </div>
        {selected ? (
          <div className="px-4 py-3 text-[12px] text-muted">
            <div className="font-[700] text-ink mb-1">{selected.name}</div>
            <div>Tipo: {selected.type}</div>
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-muted text-[12px]">
            Selecione uma camada.
          </div>
        )}
      </div>
    </div>
  );
}
