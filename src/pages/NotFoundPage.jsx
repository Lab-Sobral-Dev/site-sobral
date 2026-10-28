import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Página não encontrada | Laboratório Sobral</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="max-w-content mx-auto px-4 md:px-10 py-[100px] text-center">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-2">ERRO 404</div>
        <h1 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] mb-4">Página não encontrada</h1>
        <p className="text-[15px] text-ink-light mb-8">O endereço que você acessou não existe ou foi removido.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-[14px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C]">
            Ir para o início
          </Link>
          <Link to="/produtos" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-orange bg-white text-orange font-bold text-[14px] hover:bg-orange-50">
            Ver produtos
          </Link>
        </div>
      </section>
    </>
  );
}
