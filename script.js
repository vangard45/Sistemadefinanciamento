
let listaClientes = JSON.parse(localStorage.getItem('financia_dados')) || [];
let perfil = JSON.parse(localStorage.getItem('financia_perfil')) || {};
let corSalva = JSON.parse(localStorage.getItem('financia_cor')) || { principal: '#dc2626', hover: '#b91c1c' };
let grafico = null;

// SISTEMA DE CORES
function aplicarCor(corPrincipal, corHover) {
    document.documentElement.style.setProperty('--cor-principal', corPrincipal);
    document.documentElement.style.setProperty('--cor-principal-hover', corHover);
    document.documentElement.style.setProperty('--cor-principal-claro', `${corPrincipal}26`);
    document.documentElement.style.setProperty('--cor-principal-borda', `${corPrincipal}4d`);
    
    document.querySelectorAll('.opcao-cor').forEach(el => el.classList.remove('selecionada'));
    event.target.classList.add('selecionada');
    
    corSalva = { principal: corPrincipal, hover: corHover };
    localStorage.setItem('financia_cor', JSON.stringify(corSalva));
}
function carregarCorSalva() {
    if(corSalva) {
        document.documentElement.style.setProperty('--cor-principal', corSalva.principal);
        document.documentElement.style.setProperty('--cor-principal-hover', corSalva.hover);
        document.documentElement.style.setProperty('--cor-principal-claro', `${corSalva.principal}26`);
        document.documentElement.style.setProperty('--cor-principal-borda', `${corSalva.principal}4d`);
    }
}

// Menu
function abrirMenu() { document.getElementById('sidebar').classList.add('aberto'); document.getElementById('overlayMenu').style.display = 'block'; }
function fecharMenu() { document.getElementById('sidebar').classList.remove('aberto'); document.getElementById('overlayMenu').style.display = 'none'; }
function mostrarAba(nome) {
    document.querySelectorAll('[id^="aba-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById(`aba-${nome}`).classList.remove('hidden');
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('ativo'));
    event.currentTarget.classList.add('ativo');
    if(nome === 'perfil') carregarPerfilTela();
    atualizarSistema();
    fecharMenu();
}

// Perfil
function carregarFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            perfil.foto = e.target.result;
            localStorage.setItem('financia_perfil', JSON.stringify(perfil));
            document.getElementById('areaFoto').innerHTML = `<img src="${perfil.foto}" class="foto-perfil" alt="Foto Perfil">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function alternarEdicaoPerfil() {
    document.getElementById('edicaoPerfil').classList.toggle('aberta');
    document.getElementById('visualizacaoPerfil').classList.toggle('hidden');
    if(document.getElementById('edicaoPerfil').classList.contains('aberta')) preencherFormPerfil();
}
function preencherFormPerfil() {
    document.getElementById('perfilNome').value = perfil.nome || '';
    document.getElementById('perfilMarca').value = perfil.marca || '';
    document.getElementById('perfilTelefone').value = perfil.telefone || '';
    document.getElementById('perfilEmail').value = perfil.email || '';
    document.getElementById('perfilDocumento').value = perfil.documento || '';
    document.getElementById('perfilEndereco').value = perfil.endereco || '';
}
function carregarPerfilTela() {
    document.getElementById('perfilNomeExibicao').textContent = perfil.nome || 'Seu Nome';
    document.getElementById('perfilMarcaExibicao').textContent = perfil.marca || 'Nome do seu Negócio';
    document.getElementById('perfilNomeValor').textContent = perfil.nome || '—';
    document.getElementById('perfilMarcaValor').textContent = perfil.marca || '—';
    document.getElementById('perfilTelefoneValor').textContent = perfil.telefone || '—';
    document.getElementById('perfilEmailValor').textContent = perfil.email || '—';
    document.getElementById('perfilDocumentoValor').textContent = perfil.documento || '—';
    document.getElementById('perfilEnderecoValor').textContent = perfil.endereco || '—';
    if(perfil.foto) document.getElementById('areaFoto').innerHTML = `<img src="${perfil.foto}" class="foto-perfil" alt="Foto Perfil">`;
    else document.getElementById('areaFoto').innerHTML = `<i class="fa fa-user"></i>`;
}
document.getElementById('formPerfil').addEventListener('submit', e => {
    e.preventDefault();
    perfil.nome = document.getElementById('perfilNome').value;
    perfil.marca = document.getElementById('perfilMarca').value;
    perfil.telefone = document.getElementById('perfilTelefone').value;
    perfil.email = document.getElementById('perfilEmail').value;
    perfil.documento = document.getElementById('perfilDocumento').value;
    perfil.endereco = document.getElementById('perfilEndereco').value;
    localStorage.setItem('financia_perfil', JSON.stringify(perfil));
    alternarEdicaoPerfil();
    carregarPerfilTela();
    alert('Perfil salvo com sucesso!');
});

// Funções Gerais
function abrirModalNovo() {
    document.getElementById('tituloModal').textContent = 'Novo Compromisso';
    document.getElementById('formCadastro').reset();
    document.getElementById('indiceEdicao').value = '';
    document.getElementById('dataEmprestimo').valueAsDate = new Date();
    document.getElementById('overlayModal').style.display = 'block';
    document.getElementById('modalCadastro').style.display = 'block';
}
function fecharModal() { document.getElementById('overlayModal').style.display = 'none'; document.getElementById('modalCadastro').style.display = 'none'; }
function fecharModalDetalhes() { document.getElementById('modalDetalhes').style.display = 'none'; }
function calcularValores(valorBase, qtdParcelas) {
    // 1x = 25% | 2x = 30% | 3x = 35% | 4x = 40% ... cada parcela +5%
    let taxa = 20 + (5 * qtdParcelas);
    const total = valorBase * (1 + taxa/100);
    const valorParcela = total / qtdParcelas;
    return { taxa, total, valorParcela };
}
function calcularMulta(valorParcela, dataVenc) {
    const hoje = new Date(), venc = new Date(dataVenc); hoje.setHours(0,0,0,0); venc.setHours(0,0,0,0);
    const dias = Math.floor((hoje - venc) / (1000*60*60*24));
    if(dias <= 3) return { temMulta: false, valor: 0, dias };
    const diasMulta = dias - 3;
    return { temMulta: true, valor: valorParcela * 0.01 * diasMulta, dias, diasMulta };
}
function formatarMoeda(valor) { return Number(valor).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}); }
function formatarData(data) { return new Date(data).toLocaleDateString('pt-BR'); }
function gerarParcelas(valorParcela, qtd, dataInicio) {
    const parcelas = []; let data = new Date(dataInicio);
    for(let i=1; i<=qtd; i++) { data.setMonth(data.getMonth()+1); parcelas.push({ numero:i, valor:Number(valorParcela).toFixed(2), vencimento:data.toISOString().split('T')[0], paga:false }); }
    return parcelas;
}
function gerarLinkWhatsApp(telefone, mensagem) {
    const numero = telefone.replace(/\D/g, '');
    return `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
}
function gerarMensagemWhatsApp(cliente) {
    const v = calcularValores(cliente.valorBase, cliente.qtdParcelas);
    let msg = `*COMPROVANTE DE CONTROLE*\n\n👤 Cliente: ${cliente.nome}\n💵 Valor Base: ${formatarMoeda(cliente.valorBase)}\n📊 Taxa Total: ${v.taxa}%\n📆 Parcelamento: ${cliente.qtdParcelas}x de ${formatarMoeda(v.valorParcela)}\n💰 Total a Pagar: ${formatarMoeda(v.total)}\n\n📋 Parcelas:\n`;
    cliente.parcelas.forEach(p => {
        const m = calcularMulta(p.valor, p.vencimento);
        const final = Number(p.valor) + m.valor;
        msg += `• Parcela ${p.numero}: ${formatarMoeda(final)} | Venc: ${formatarData(p.vencimento)} | ${p.paga?'✅ PAGA':'🔓 ABERTA'}${m.temMulta?` ⚠️ +${m.diasMulta}d multa`:""}\n`;
    });
    msg += `\n📝 Observações: ${cliente.observacoes || 'Nenhuma'}\n\n_Gerado por Financia 2.0_`;
    return msg;
}
function verificarStatus(cliente) {
    const hoje = new Date(); hoje.setHours(0,0,0,0); let atrasado = false, todosPagos = true;
    cliente.parcelas.forEach(p => { if(!p.paga && new Date(p.vencimento) < hoje) atrasado = true; if(!p.paga) todosPagos = false; });
    if(todosPagos) return { texto:'Concluído', classe:'badge-verde' };
    if(atrasado) return { texto:'Atrasado', classe:'badge-vermelho' };
    return { texto:'Em Andamento', classe:'badge-laranja' };
}
function salvarDados() { localStorage.setItem('financia_dados', JSON.stringify(listaClientes)); atualizarSistema(); }
function apagarTudo() {
    if(confirm('Tem certeza? Isso apaga TODOS os dados!')) { if(confirm('Confirma novamente?')) { listaClientes = []; perfil = {}; localStorage.clear(); localStorage.setItem('financia_cor', JSON.stringify(corSalva)); atualizarSistema(); carregarPerfilTela(); alert('Todos os dados foram apagados!'); } }
}
function editarCliente(indice) {
    const c = listaClientes[indice];
    document.getElementById('tituloModal').textContent = 'Editar Compromisso';
    document.getElementById('indiceEdicao').value = indice;
    document.getElementById('nomeCliente').value = c.nome;
    document.getElementById('valorBase').value = c.valorBase;
    document.getElementById('qtdParcelas').value = c.qtdParcelas;
    document.getElementById('dataEmprestimo').value = c.dataEmprestimo;
    document.getElementById('contatoCliente').value = c.contato || '';
    document.getElementById('observacoes').value = c.observacoes || '';
    document.getElementById('overlayModal').style.display = 'block';
    document.getElementById('modalCadastro').style.display = 'block';
}
function verDetalhes(indice) {
    const c = listaClientes[indice]; const v = calcularValores(c.valorBase, c.qtdParcelas); const st = verificarStatus(c);
    const linkWpp = c.contato ? gerarLinkWhatsApp(c.contato, gerarMensagemWhatsApp(c)) : null;
    let html = `
    <div class="space-y-4">
        <div class="flex flex-wrap justify-between items-center gap-2">
            <h4 class="text-xl font-semibold">${c.nome}</h4>
            <span class="badge ${st.classe}">${st.texto}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span class="text-slate-400">Valor Base:</span> ${formatarMoeda(c.valorBase)}</div>
            <div><span class="text-slate-400">Taxa Total:</span> <span class="cor-primaria font-medium">${v.taxa}%</span></div>
            <div><span class="text-slate-400">Parcelas:</span> ${c.qtdParcelas}x de ${formatarMoeda(v.valorParcela)}</div>
            <div><span class="text-slate-400">Total a Pagar:</span> <span class="cor-primaria font-medium">${formatarMoeda(v.total)}</span></div>
            <div><span class="text-slate-400">Data do Empréstimo:</span> ${formatarData(c.dataEmprestimo)}</div>
            <div><span class="text-slate-400">Contato:</span> ${c.contato || 'Não informado'}</div>
        </div>
        ${c.observacoes?`<div class="text-sm"><span class="text-slate-400">Observações:</span> ${c.observacoes}</div>`:""}
        <div class="flex flex-wrap gap-2 pt-2">
            <button class="btn btn-outline" onclick="editarCliente(${indice}); fecharModalDetalhes();">
                <i class="fa fa-pencil"></i> Editar Dados
            </button>
            ${linkWpp?`<a href="${linkWpp}" target="_blank" class="btn btn-whatsapp"><i class="fa fa-whatsapp"></i> Enviar Comprovante</a>`:""}
        </div>
        <hr class="border-slate-700 my-4">
        <h5 class="font-semibold cor-primaria">Parcelas</h5>
        <div class="space-y-2 mt-2">
            ${c.parcelas.map((p, i) => {
                const m = calcularMulta(p.valor, p.vencimento); const final = Number(p.valor) + m.valor;
                return `<div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-escuro p-3 rounded-lg gap-2 ${m.temMulta?'border border-cor-primaria':''}">
                    <div>Parcela ${p.numero}: ${formatarMoeda(final)} | Venc: ${formatarData(p.vencimento)} ${m.temMulta?`<p class="text-xs cor-primaria mt-1">⚠️ ${m.diasMulta} dias de multa (1% ao dia)</p>`:""}</div>
                    ${!p.paga?`<button class="btn btn-primario text-xs py-1.5" onclick="marcarPago(${indice},${i})">Marcar Paga</button>`:`<span class="text-sucesso">✅ Paga</span>`}
                </div>`;
            }).join('')}
        </div>
    </div>`;
    document.getElementById('conteudoDetalhes').innerHTML = html;
    document.getElementById('modalDetalhes').style.display = 'block';
}
function marcarPago(indiceCli, indiceParc) { listaClientes[indiceCli].parcelas[indiceParc].paga = true; salvarDados(); verDetalhes(indiceCli); }
function excluirCliente(indice) { if(confirm('Tem certeza?')) { listaClientes.splice(indice,1); salvarDados(); } }

// Atualizar Sistema
function atualizarSistema() {
    let andamento=0, atrasados=0, concluidos=0, total=0;
    listaClientes.forEach(c => { const st = verificarStatus(c); if(st.texto === 'Em Andamento') andamento++; else if(st.texto === 'Atrasado') atrasados++; else concluidos++; total += c.valorBase; });
    document.getElementById('qtdAndamento').textContent = andamento;
    document.getElementById('qtdAtrasados').textContent = atrasados;
    document.getElementById('qtdConcluidos').textContent = concluidos;
    document.getElementById('totalValor').textContent = formatarMoeda(total);
    if(grafico) grafico.destroy();
    const ctx = document.getElementById('graficoStatus').getContext('2d');
    grafico = new Chart(ctx, { type: 'doughnut', data: { labels: ['Em Andamento', 'Atrasados', 'Concluídos'], datasets: [{ data: [andamento, atrasados, concluidos], backgroundColor: ['#f59e0b','var(--cor-principal)','#16a34a'], borderWidth:0 }] }, options: { responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'bottom', labels: { color:'#cbd5e1', padding:15 } } } } });
    const htmlLista = (lista) => {
        if(!lista.length) return `<div class="text-center py-8 text-slate-400">Nenhum registro encontrado.</div>`;
        return lista.map((c, i) => {
            const st = verificarStatus(c); const v = calcularValores(c.valorBase, c.qtdParcelas);
            const linkWpp = c.contato ? gerarLinkWhatsApp(c.contato, gerarMensagemWhatsApp(c)) : null;
            return `<div class="card card-hover">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                            <h4 class="font-semibold">${c.nome}</h4>
                            <span class="badge ${st.classe}">${st.texto}</span>
                        </div>
                        <p class="text-sm text-slate-400">${formatarMoeda(c.valorBase)} • ${c.qtdParcelas}x de ${formatarMoeda(v.valorParcela)} • Total ${formatarMoeda(v.total)}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-outline text-sm" onclick="verDetalhes(${i})"><i class="fa fa-eye"></i> Detalhes</button>
                        ${linkWpp?`<a href="${linkWpp}" target="_blank" class="btn btn-whatsapp text-sm"><i class="fa fa-whatsapp"></i> Enviar</a>`:""}
                        <button class="btn-lapis text-sm" onclick="editarCliente(${i})" title="Editar"><i class="fa fa-pencil"></i></button>
                        <button class="btn btn-outline text-sm cor-primaria border-cor-primaria hover:bg-cor-primaria hover:text-white" onclick="excluirCliente(${i})"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    };
    document.getElementById('listaUltimos').innerHTML = htmlLista([...listaClientes].reverse().slice(0,5));
    document.getElementById('listaClientes').innerHTML = htmlLista(listaClientes);
}

// Eventos Iniciais
carregarCorSalva();
document.getElementById('dataEmprestimo').valueAsDate = new Date();
document.getElementById('formCadastro').addEventListener('submit', e => {
    e.preventDefault(); const indice = document.getElementById('indiceEdicao').value;
    const dados = { nome: document.getElementById('nomeCliente').value, valorBase: Number(document.getElementById('valorBase').value), qtdParcelas: Number(document.getElementById('qtdParcelas').value), dataEmprestimo: document.getElementById('dataEmprestimo').value, contato: document.getElementById('contatoCliente').value, observacoes: document.getElementById('observacoes').value, parcelas: [] };
    const v = calcularValores(dados.valorBase, dados.qtdParcelas);
    dados.parcelas = gerarParcelas(v.valorParcela, dados.qtdParcelas, dados.dataEmprestimo);
    if(indice) { dados.parcelas = dados.parcelas.map((p, i) => ({...p, paga: listaClientes[indice].parcelas[i]?.paga || false})); listaClientes[indice] = dados; }
    else listaClientes.push(dados);
    salvarDados(); fecharModal(); alert('Salvo com sucesso!');
});
atualizarSistema();