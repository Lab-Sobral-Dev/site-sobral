/* ============ Página: Fale Conosco ============ */

function FaleConoscoPage({ onNavigate }) {
  const [form, setForm] = React.useState({
    nome: '', sobrenome: '', email: '', celular: '',
    endereco: '', estado: '', assunto: '', mensagem: ''
  });
  const [sent, setSent] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['nome', 'sobrenome', 'email', 'celular', 'assunto', 'mensagem'];
    const newErrors = {};
    required.forEach(f => { if (!form[f].trim()) newErrors[f] = true; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setSent(true);
    setTimeout(() => {
      setForm({ nome: '', sobrenome: '', email: '', celular: '', endereco: '', estado: '', assunto: '', mensagem: '' });
      setSent(false);
    }, 3000);
  };

  const inp = (field) => ({
    className: `input ${errors[field] ? 'error' : ''}`,
    style: errors[field] ? { borderColor: '#E04444', boxShadow: '0 0 0 3px rgba(224,68,68,.12)' } : {},
    value: form[field],
    onChange: handleChange(field),
  });

  return (
    <>
      <Breadcrumb trail={[
        { label: '🏠 Home', page: 'home' },
        { label: 'Fale Conosco' }
      ]} onNavigate={onNavigate} />

      <section className="container" style={{marginTop: 40}}>
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 48, marginBottom: 48}}>
          <div>
            <h2 style={{fontSize: 22, fontWeight: 800, color: 'var(--orange)', marginBottom: 18}}>
              LABORATÓRIO SOBRAL
            </h2>

            <div style={{marginBottom: 22, fontSize: 14.5, lineHeight: 1.6}}>
              <div style={{fontWeight: 800, marginBottom: 4}}>Unidade Fabril</div>
              <div>Rua Bento Leão, 25, Centro</div>
              <div>Floriano | PI | CEP 64800-062.</div>
              <div>Telefone: (89) 2101-2202</div>
            </div>

            <div style={{fontSize: 14.5, lineHeight: 1.6}}>
              <div style={{fontWeight: 800, marginBottom: 4}}>Escritório Comercial</div>
              <div>Avenida Elias João Tajra, 1601, Fátima</div>
              <div>Teresina | PI | CEP 64049-300</div>
              <div>Telefone: (89) 99921-0283</div>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap: 14, alignItems:'flex-start'}}>
            <div className="contact-chip">
              <div className="contact-chip-title">MARKETING</div>
              <div style={{fontSize: 14, color:'var(--ink-light)', marginTop: 4}}>(89) 99999-9999</div>
              <div style={{fontSize: 14, color:'var(--ink-light)'}}>marketing@laboratoriosobral.com.br</div>
            </div>
            <div className="contact-chip">
              <div className="contact-chip-title">ATENDIMENTO</div>
              <div style={{fontSize: 14, color:'var(--ink-light)', marginTop: 4}}>(89) 99999-9999</div>
            </div>
            <div style={{marginTop: 10, fontSize: 18, fontWeight: 800, color:'var(--orange)'}}>
              SAC 0800 979 5040
            </div>
          </div>
        </div>

        <h2 style={{fontSize: 22, fontWeight: 800, color: 'var(--orange)', marginBottom: 18}}>
          Fale Conosco
        </h2>

        {sent && (
          <div style={{
            padding: '14px 20px', marginBottom: 18,
            background: '#E8F5E8', color: '#2D6A2D',
            borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 14
          }}>
            ✓ Mensagem enviada com sucesso! Retornaremos em breve.
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <input placeholder="Nome*" {...inp('nome')} />
          <input placeholder="Sobrenome*" {...inp('sobrenome')} />
          <input placeholder="E-mail*" type="email" {...inp('email')} />
          <input placeholder="Celular*" {...inp('celular')} />
          <input placeholder="Endereço" {...inp('endereco')} />
          <select className="input" value={form.estado} onChange={handleChange('estado')}>
            <option value="">Estado</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
          <div className="full">
            <input placeholder="Assunto*" {...inp('assunto')} />
          </div>
          <div className="full">
            <textarea placeholder="Mensagem*" className="textarea"
              style={errors.mensagem ? { borderColor: '#E04444', boxShadow: '0 0 0 3px rgba(224,68,68,.12)' } : {}}
              value={form.mensagem} onChange={handleChange('mensagem')} />
          </div>
          <div className="submit-row">
            <button type="submit" className="btn btn-primary" style={{padding: '12px 36px'}}>
              ENVIAR
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

window.FaleConoscoPage = FaleConoscoPage;
