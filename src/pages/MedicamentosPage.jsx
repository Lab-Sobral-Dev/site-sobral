import { Helmet } from 'react-helmet-async';

export default function MedicamentosPage() {
  return (
    <>
      <Helmet>
        <title>Medicamentos Sobral | Laboratório Sobral</title>
        <meta name="description" content="Comunicado sobre a descontinuidade estratégica dos medicamentos do Laboratório Sobral e a migração para o segmento de suplementos alimentares." />
        <meta property="og:title" content="Medicamentos Sobral | Laboratório Sobral" />
        <meta property="og:description" content="Comunicado sobre a descontinuidade estratégica dos medicamentos do Laboratório Sobral." />
        <meta property="og:type" content="website" />
      </Helmet>

      <h1 className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Medicamentos Sobral
      </h1>

      <section className="max-w-content mx-auto px-4 md:px-10 mt-12 pb-16">
        <h2 className="text-[28px] font-[800] text-orange text-center mb-8">COMUNICADO</h2>

        <div className="text-[15.5px] leading-[1.8] text-ink-light">
          <p className="mb-[22px]">
            Diante das transformações que foram necessárias nestes últimos meses, o Laboratório Sobral
            construiu uma evolução muito positiva em seu modelo de negócios. Para alcançar uma visão mais
            sustentável e avançada dos produtos ofertados a seus clientes, migrou para o segmento de
            Suplementos Alimentares, visando a qualidade de vida e benefícios preventivos. Um avanço
            significativo, pela adequação aos novos tempos e atendimento às expectativas dos nossos clientes.
          </p>
          <p className="mb-[22px]">
            Com isto, houve a descontinuidade estratégica dos nossos Medicamentos, sendo muito importante
            destacar que não há quaisquer restrições à venda, ao consumo e a segurança destes Medicamentos,
            incluindo aqueles que já foram comercializados ou os que, ainda em estoque, poderão ser
            comercializados livremente.
          </p>
          <p className="mb-[22px]">
            Nosso compromisso e responsabilidade com nossos clientes e com a sociedade permanecem inalterados
            e válidos.
          </p>
          <p>
            Qualquer dúvida sobre estes medicamentos deve ser encaminhada ao nosso SAC através do e-mail{' '}
            <a href="mailto:sac@laboratoriosobral.com.br" className="text-orange font-bold hover:underline">
              sac@laboratoriosobral.com.br
            </a>{' '}
            ou dos telefones{' '}
            <a href="tel:08009795040" className="font-bold text-ink hover:underline">0800 979 5040</a> e{' '}
            <a href="tel:+558921012202" className="font-bold text-ink hover:underline">(89) 2101-2202</a>.
          </p>
        </div>
      </section>
    </>
  );
}
