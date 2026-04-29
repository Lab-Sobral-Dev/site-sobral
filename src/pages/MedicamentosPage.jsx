export default function MedicamentosPage() {
  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Medicamentos
      </div>

      <section className="max-w-[920px] mx-auto px-10 mt-12 pb-16">
        <h2 className="text-[28px] font-[800] text-orange text-center mb-8">
          Comunicado
        </h2>

        <div className="text-[15.5px] leading-[1.8] text-ink-light">
          <p className="mb-[22px]">
            Diante das transformações que foram necessárias nestes últimos meses, o Laboratório Sobral
            construiu uma evolução muito positiva em seu modelo de negócios. Para alcançar uma visão mais
            sustentável e avançada dos produtos ofertados a seus clientes,{' '}
            <strong className="text-ink">migrou para o segmento de suplementos alimentares</strong>,
            visando a qualidade de vida e benefícios preventivos. Um avanço significativo, pela adequação
            aos novos tempos e atendimento às expectativas dos nossos clientes.
          </p>
          <p className="mb-[22px]">
            Com isto, houve a{' '}
            <strong className="text-ink">descontinuidade estratégica dos nossos medicamentos</strong>,
            sendo muito importante destacar que não há quaisquer restrições à venda, ao consumo e a segurança
            destes medicamentos, incluindo aqueles que já foram comercializados ou os que, ainda em estoque,
            poderão ser comercializados livremente.
          </p>
          <p className="mb-[22px]">
            Nosso compromisso e responsabilidade com nossos clientes e com a sociedade permanecem
            inalterados e válidos.
          </p>
          <p>
            Qualquer dúvida sobre estes medicamentos deve ser encaminhada ao nosso SAC através do e-mail{' '}
            <strong className="text-ink">sac@laboratoriosobral.com.br</strong>{' '}
            ou dos telefones{' '}
            <strong className="text-ink">0800 979 5040</strong> e{' '}
            <strong className="text-ink">(89) 2101-2202</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
