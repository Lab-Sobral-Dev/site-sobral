/* ============ Página: Medicamentos (comunicado) ============ */

function MedicamentosPage() {
  return (
    <>
      <SectionTitleBar>Medicamentos</SectionTitleBar>

      <section className="container" style={{marginTop: 48, maxWidth: 920}}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--orange)',
          textAlign: 'center',
          marginBottom: 32
        }}>
          Comunicado
        </h2>

        <div style={{fontSize: 15.5, lineHeight: 1.8, color: 'var(--ink-light)'}}>
          <p style={{marginBottom: 22}}>
            Diante das transformações que foram necessárias nestes últimos meses, o Laboratório Sobral
            construiu uma evolução muito positiva em seu modelo de negócios. Para alcançar uma visão mais
            sustentável e avançada dos produtos ofertados a seus clientes,{' '}
            <strong style={{color: 'var(--ink)'}}>migrou para o segmento de suplementos alimentares</strong>,
            visando a qualidade de vida e benefícios preventivos. Um avanço significativo, pela adequação
            aos novos tempos e atendimento às expectativas dos nossos clientes.
          </p>
          <p style={{marginBottom: 22}}>
            Com isto, houve a{' '}
            <strong style={{color: 'var(--ink)'}}>descontinuidade estratégica dos nossos medicamentos</strong>,
            sendo muito importante destacar que não há quaisquer restrições à venda, ao consumo e a segurança
            destes medicamentos, incluindo aqueles que já foram comercializados ou os que, ainda em estoque,
            poderão ser comercializados livremente.
          </p>
          <p style={{marginBottom: 22}}>
            Nosso compromisso e responsabilidade com nossos clientes e com a sociedade permanecem
            inalterados e válidos.
          </p>
          <p>
            Qualquer dúvida sobre estes medicamentos deve ser encaminhada ao nosso SAC através do e-mail{' '}
            <strong style={{color: 'var(--ink)'}}>sac@laboratoriosobral.com.br</strong>{' '}
            ou dos telefones{' '}
            <strong style={{color: 'var(--ink)'}}>0800 979 5040</strong> e <strong style={{color: 'var(--ink)'}}>(89) 2101-2202</strong>.
          </p>
        </div>
      </section>
    </>
  );
}

window.MedicamentosPage = MedicamentosPage;
