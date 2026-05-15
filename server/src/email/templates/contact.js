function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactEmailHtml({ nome, sobrenome, email, celular, assunto, mensagem, endereco, estado }) {
  const s = {
    nome:      escapeHtml(nome),
    sobrenome: escapeHtml(sobrenome),
    email:     escapeHtml(email),
    celular:   escapeHtml(celular),
    assunto:   escapeHtml(assunto),
    mensagem:  escapeHtml(mensagem),
    endereco:  escapeHtml(endereco),
    estado:    escapeHtml(estado),
  };

  const row = (label, value) => value
    ? `<tr><td style="padding:6px 12px;color:#6b6b6b;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 12px;color:#3d3d3d;font-size:13px">${value}</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px">

        <tr><td style="background:#F37021;padding:24px 32px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700">Laboratório Sobral</p>
          <p style="margin:4px 0 0;color:#ffe0cc;font-size:13px">Nova mensagem pelo formulário de contato</p>
        </td></tr>

        <tr><td style="padding:28px 32px 8px">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#3d3d3d">${s.nome} ${s.sobrenome}</p>
          <p style="margin:0;font-size:13px;color:#6b6b6b">${s.assunto}</p>
        </td></tr>

        <tr><td style="padding:16px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
            ${row('E-mail',    s.email)}
            ${row('Celular',   s.celular)}
            ${row('Endereço',  s.endereco)}
            ${row('Estado',    s.estado)}
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 28px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#3d3d3d">Mensagem</p>
          <div style="background:#f9f9f9;border-radius:6px;padding:16px;font-size:14px;color:#3d3d3d;line-height:1.7;white-space:pre-wrap">${s.mensagem}</div>
        </td></tr>

        <tr><td style="background:#f5f5f5;padding:16px 32px;text-align:center">
          <p style="margin:0;font-size:11px;color:#9a9a9a">Laboratório Sobral — sac@laboratoriosobral.com.br — (89) 2101-2202</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { contactEmailHtml };
