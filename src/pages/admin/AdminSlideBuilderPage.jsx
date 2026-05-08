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

function PreviewModal({ layers, onClose, onReplay, replayKey }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="relative w-full max-w-[1200px]" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white text-ink hover:bg-orange hover:text-white flex items-center justify-center text-[20px] leading-none shadow-lg z-10"
        >
          ×
        </button>
        <button
          onClick={onReplay}
          className="absolute -top-4 right-8 px-4 h-9 rounded-full bg-white text-ink hover:bg-orange hover:text-white text-[12px] font-[700] shadow-lg z-10"
        >
          ↻ Repetir
        </button>
        <div key={replayKey} className="relative w-full h-full bg-gray-800 rounded-[8px] overflow-hidden">
          {layers.filter(l => l.visible).map((layer) => {
            const style = {
              position: 'absolute',
              left:   `${(layer.x / CANVAS_W) * 100}%`,
              top:    `${(layer.y / CANVAS_H) * 100}%`,
              width:  `${(layer.width  / CANVAS_W) * 100}%`,
              height: `${(layer.height / CANVAS_H) * 100}%`,
              animationDelay: layer.animation ? `${layer.animation.delay ?? 0}s` : undefined,
            };
            const animClass = layer.animation ? `layer-anim-${layer.animation.type}` : '';
            if (layer.type === 'image') {
              return <img key={layer.id} src={layer.url} alt={layer.name || ''} style={style} className={animClass} draggable={false} />;
            }
            return (
              <div
                key={layer.id}
                style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
                className={`flex items-center justify-center rounded-lg font-bold text-sm shadow-lg ${animClass}`}
              >
                {layer.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const HANDLES = [
  { dir: 'nw', x: '0%',   y: '0%',   cursor: 'nwse-resize' },
  { dir: 'n',  x: '50%',  y: '0%',   cursor: 'ns-resize'   },
  { dir: 'ne', x: '100%', y: '0%',   cursor: 'nesw-resize' },
  { dir: 'e',  x: '100%', y: '50%',  cursor: 'ew-resize'   },
  { dir: 'se', x: '100%', y: '100%', cursor: 'nwse-resize' },
  { dir: 's',  x: '50%',  y: '100%', cursor: 'ns-resize'   },
  { dir: 'sw', x: '0%',   y: '100%', cursor: 'nesw-resize' },
  { dir: 'w',  x: '0%',   y: '50%',  cursor: 'ew-resize'   },
];

function ResizeHandles({ onPointerDown }) {
  return (
    <>
      {HANDLES.map(h => (
        <div
          key={h.dir}
          onPointerDown={e => onPointerDown(e, h.dir)}
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-[2px]"
          style={{
            left: h.x, top: h.y,
            transform: 'translate(-50%, -50%)',
            cursor: h.cursor,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}

export default function AdminSlideBuilderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();

  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);
  const [editingName, setEditingName] = useState(null); // layer.id em edição
  const [reorderDrag, setReorderDrag] = useState(null); // { id, overId }
  const [previewKey,  setPreviewKey]  = useState(0);

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

  function getCanvasScale() {
    if (!canvasRef.current) return 1;
    return canvasRef.current.getBoundingClientRect().width / CANVAS_W;
  }

  const handleLayerPointerDown = (e, layer) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(layer.id);
    dragRef.current = {
      mode: 'move',
      layerId: layer.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const MIN_SIZE = 12;

  const handleCanvasPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const scale = getCanvasScale();
    const dx = (e.clientX - d.startClientX) / scale;
    const dy = (e.clientY - d.startClientY) / scale;

    if (d.mode === 'move') {
      updateLayer(d.layerId, {
        x: Math.round(d.origX + dx),
        y: Math.round(d.origY + dy),
      });
      return;
    }

    if (d.mode === 'resize') {
      let { origX, origY, origW, origH } = d;
      let x = origX, y = origY, w = origW, h = origH;
      const dir = d.dir;
      if (dir.includes('e')) w = Math.max(MIN_SIZE, origW + dx);
      if (dir.includes('s')) h = Math.max(MIN_SIZE, origH + dy);
      if (dir.includes('w')) {
        const newW = Math.max(MIN_SIZE, origW - dx);
        x = origX + (origW - newW);
        w = newW;
      }
      if (dir.includes('n')) {
        const newH = Math.max(MIN_SIZE, origH - dy);
        y = origY + (origH - newH);
        h = newH;
      }
      updateLayer(d.layerId, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
    }
  };

  const handleResizeHandlePointerDown = (e, layer, dir) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      mode: 'resize',
      dir,
      layerId: layer.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      origW: layer.width,
      origH: layer.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerUp = () => { dragRef.current = null; };

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

  const moveLayer = (fromId, toId) => {
    setLayers(ls => {
      const fromIdx = ls.findIndex(l => l.id === fromId);
      const toIdx   = ls.findIndex(l => l.id === toId);
      if (fromIdx === -1 || toIdx === -1) return ls;
      const next = [...ls];
      const [m] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, m);
      return next;
    });
  };

  const handleListItemPointerDown = (e, layerId) => {
    setReorderDrag({ id: layerId, overId: layerId });
  };

  const handleListItemPointerEnter = (layerId) => {
    setReorderDrag(d => d ? { ...d, overId: layerId } : null);
  };

  const handleListPointerUp = () => {
    if (reorderDrag && reorderDrag.id !== reorderDrag.overId) {
      moveLayer(reorderDrag.id, reorderDrag.overId);
    }
    setReorderDrag(null);
  };

  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;

  // Lista é exibida do topo (último do array = z-index maior) para baixo.
  const reversedLayers = [...layers].reverse();
  const selected = layers.find(l => l.id === selectedId) || null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PAINEL ESQUERDO — LISTA DE CAMADAS ── */}
      <div className="w-[240px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Camadas ({layers.length})
        </div>
        <div
          className="flex-1 overflow-y-auto py-2"
          onPointerUp={handleListPointerUp}
          onPointerLeave={() => setReorderDrag(null)}
        >
          {reversedLayers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-[12px]">
              Nenhuma camada. Importe um PSD para começar.
            </div>
          ) : reversedLayers.map(layer => {
            const isOver = reorderDrag && reorderDrag.overId === layer.id && reorderDrag.id !== layer.id;
            return (
              <div
                key={layer.id}
                onPointerEnter={() => reorderDrag && handleListItemPointerEnter(layer.id)}
                className={`relative flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-[6px] cursor-pointer ${
                  selectedId === layer.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                } ${isOver ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setSelectedId(layer.id)}
              >
                <span
                  onPointerDown={e => handleListItemPointerDown(e, layer.id)}
                  className="text-[#bbb] text-[14px] cursor-grab select-none"
                  title="Arrastar para reordenar"
                >
                  ⠿
                </span>
                <span className="text-[14px]">{layer.type === 'button' ? '🔘' : '🖼'}</span>
                {editingName === layer.id ? (
                  <input
                    autoFocus
                    type="text"
                    defaultValue={layer.name || ''}
                    onBlur={e => { updateLayer(layer.id, { name: e.target.value }); setEditingName(null); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { updateLayer(layer.id, { name: e.target.value }); setEditingName(null); }
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="text-[12px] font-[600] flex-1 border border-orange rounded px-1 py-0.5 outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={e => { e.stopPropagation(); setEditingName(layer.id); }}
                    className="text-[12px] font-[600] text-ink flex-1 truncate"
                    title="Clique duplo para renomear"
                  >
                    {layer.name || 'Camada'}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                  className="text-[14px] leading-none opacity-60 hover:opacity-100"
                  title={layer.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {layer.visible ? '👁' : '🙈'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CANVAS CENTRAL ── */}
      <div className="flex-1 flex flex-col bg-[#e5e7eb] min-w-0">
        <div className="bg-[#1f2937] px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-white/40 flex-1 truncate">Slide #{slide.id}</span>
          <button
            onClick={() => { setPreview(true); setPreviewKey(k => k + 1); }}
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
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          >
            {layers.filter(l => l.visible).map((layer) => {
              const wrapStyle = {
                position: 'absolute',
                left:   `${(layer.x / CANVAS_W) * 100}%`,
                top:    `${(layer.y / CANVAS_H) * 100}%`,
                width:  `${(layer.width  / CANVAS_W) * 100}%`,
                height: `${(layer.height / CANVAS_H) * 100}%`,
              };
              const isSel = layer.id === selectedId;
              const ringClass = isSel ? 'outline outline-2 outline-blue-500' : '';

              return (
                <div
                  key={layer.id}
                  style={wrapStyle}
                  className={`cursor-move ${ringClass}`}
                  onPointerDown={e => handleLayerPointerDown(e, layer)}
                >
                  {layer.type === 'image' ? (
                    <img
                      src={layer.url}
                      alt={layer.name || ''}
                      draggable={false}
                      className="w-full h-full pointer-events-none"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: layer.bgColor, color: layer.textColor }}
                      className="w-full h-full flex items-center justify-center rounded-lg font-bold text-sm pointer-events-none"
                    >
                      {layer.text || 'Botão'}
                    </div>
                  )}
                  {isSel && (
                    <ResizeHandles onPointerDown={(e, dir) => handleResizeHandlePointerDown(e, layer, dir)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — PROPRIEDADES ── */}
      <div className="w-[260px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Propriedades
        </div>
        {!selected ? (
          <div className="px-4 py-6 text-center text-muted text-[12px]">
            Selecione uma camada.
          </div>
        ) : (
          <>
            {/* Posição/tamanho */}
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Posição (px)</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-[600] text-muted">
                  X
                  <input
                    type="number"
                    value={selected.x}
                    onChange={e => updateLayer(selected.id, { x: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Y
                  <input
                    type="number"
                    value={selected.y}
                    onChange={e => updateLayer(selected.id, { y: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Largura
                  <input
                    type="number"
                    value={selected.width}
                    min={MIN_SIZE}
                    onChange={e => updateLayer(selected.id, { width: Math.max(MIN_SIZE, parseInt(e.target.value) || MIN_SIZE) })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Altura
                  <input
                    type="number"
                    value={selected.height}
                    min={MIN_SIZE}
                    onChange={e => updateLayer(selected.id, { height: Math.max(MIN_SIZE, parseInt(e.target.value) || MIN_SIZE) })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
              </div>
            </div>

            {/* Tipo + conversão */}
            <div className="px-4 py-3 border-b border-line">
              {selected.type === 'image' ? (
                <button
                  onClick={() => updateLayer(selected.id, {
                    type: 'button',
                    text: 'Ver catálogo',
                    href: '/produtos',
                    bgColor: '#F37021',
                    textColor: '#FFFFFF',
                  })}
                  className="w-full text-[11px] font-[700] py-1.5 rounded-[6px] border border-line hover:border-orange hover:text-orange"
                >
                  Converter para botão
                </button>
              ) : (
                <button
                  onClick={() => updateLayer(selected.id, {
                    type: 'image',
                    url: selected.url || '',
                  })}
                  className="w-full text-[11px] font-[700] py-1.5 rounded-[6px] border border-line hover:border-orange hover:text-orange"
                >
                  Converter para imagem
                </button>
              )}
            </div>

            {/* Campos específicos */}
            {selected.type === 'image' && (
              <div className="px-4 py-3 border-b border-line">
                <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">URL da imagem</div>
                <input
                  type="text"
                  value={selected.url || ''}
                  onChange={e => updateLayer(selected.id, { url: e.target.value })}
                  className="w-full border border-line rounded-[6px] px-2 py-1 text-[11px] text-ink outline-none focus:border-orange"
                  placeholder="/images/..."
                />
                {selected.url && (
                  <img src={selected.url} alt="" className="mt-2 max-h-20 mx-auto object-contain" />
                )}
              </div>
            )}

            {selected.type === 'button' && (
              <>
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Texto</div>
                  <input
                    type="text"
                    value={selected.text || ''}
                    onChange={e => updateLayer(selected.id, { text: e.target.value })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </div>
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">URL (href)</div>
                  <input
                    type="text"
                    value={selected.href || ''}
                    onChange={e => updateLayer(selected.id, { href: e.target.value })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </div>
                <div className="px-4 py-3 border-b border-line grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-[600] text-muted">
                    Cor de fundo
                    <input
                      type="color"
                      value={selected.bgColor || '#F37021'}
                      onChange={e => updateLayer(selected.id, { bgColor: e.target.value })}
                      className="mt-1 w-full h-7 border border-line rounded-[6px] outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-[600] text-muted">
                    Cor do texto
                    <input
                      type="color"
                      value={selected.textColor || '#FFFFFF'}
                      onChange={e => updateLayer(selected.id, { textColor: e.target.value })}
                      className="mt-1 w-full h-7 border border-line rounded-[6px] outline-none"
                    />
                  </label>
                </div>
              </>
            )}

            {/* Animação */}
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Animação</div>
              <select
                value={selected.animation?.type || ''}
                onChange={e => {
                  const t = e.target.value;
                  if (!t) updateLayer(selected.id, { animation: null });
                  else updateLayer(selected.id, { animation: { type: t, delay: selected.animation?.delay ?? 0 } });
                }}
                className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink bg-white outline-none focus:border-orange"
              >
                {ANIMATION_OPTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              {selected.animation && (
                <div className="mt-2">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-1">Delay (s)</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={selected.animation.delay ?? 0}
                    onChange={e => updateLayer(selected.id, {
                      animation: { ...selected.animation, delay: parseFloat(e.target.value) || 0 },
                    })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] outline-none focus:border-orange"
                  />
                </div>
              )}
            </div>

            {/* Visibilidade */}
            <div className="px-4 py-3">
              <label className="flex items-center gap-2 text-[12px] font-[600] text-ink">
                <input
                  type="checkbox"
                  checked={selected.visible}
                  onChange={e => updateLayer(selected.id, { visible: e.target.checked })}
                />
                Visível
              </label>
            </div>
          </>
        )}
      </div>

      {preview && (
        <PreviewModal
          layers={layers}
          onClose={() => setPreview(false)}
          onReplay={() => setPreviewKey(k => k + 1)}
          replayKey={previewKey}
        />
      )}
    </div>
  );
}
