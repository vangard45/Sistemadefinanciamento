const firebaseConfig = {
    apiKey: "AIzaSyAo-P6CDEoZwDljmLOs9M4vyM8KVNpVNbQ",
    authDomain: "aplicativo-78b22.firebaseapp.com",
    databaseURL: "https://aplicativo-78b22-default-rtdb.firebaseio.com",
    projectId: "aplicativo-78b22",
    storageBucket: "aplicativo-78b22.firebasestorage.app",
    messagingSenderId: "284898522347",
    appId: "1:284898522347:web:fe02f582cec1ad53cafaae",
    measurementId: "G-87VNV9Q3EJ"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

let usuarioLogadoUid = null;
let usuarioLogadoEmail = "";

function refUsuario(caminho) {
    return db.ref(`usuarios/${usuarioLogadoUid}/${caminho}`);
}

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    usuarioLogadoUid = user.uid;
    usuarioLogadoEmail = user.email || "";

    document.getElementById('conteudo-principal').style.display = 'block';

    carregarMeuPerfil();
    carregarPainelGeral();
    carregarListaPessoas();
    carregarFinancas();
    verificarTourNovoUsuario();
});

function finalizarSessao() {
    if (confirm("Deseja realmente sair da sua conta?")) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(err => notificar("Erro ao sair: " + err.message, 'erro'));
    }
}

let passoAtualTour = 0;
const etapasTour = [
    {
        titulo: "Bem-vindo ao Painel Financeiro!",
        texto: "Este é o seu ambiente corporativo de elite. Aqui você controla todas as suas finanças pessoais e de investimentos com total segurança e isolamento.",
        icone: "bi-rocket-takeoff-fill"
    },
    {
        titulo: "Gestão Completa de Clientes",
        texto: "Na aba 'Clientes', você cadastra sua carteira, controla parcelas de investimentos e gera links instantâneos para contato via WhatsApp.",
        icone: "bi-people-fill"
    },
    {
        titulo: "Controle de Entradas e Gastos",
        texto: "Na aba 'Finanças', você gerencia seu fluxo de caixa diário. Tudo é sincronizado automaticamente com o seu saldo em tempo real!",
        icone: "bi-wallet2"
    }
];

function verificarTourNovoUsuario() {
    const jaViu = localStorage.getItem(`tour_visto_${usuarioLogadoUid}`);
    if (!jaViu) {
        abrirTour();
    }
}

function abrirTour() {
    passoAtualTour = 0;
    atualizarConteudoTour();
    document.getElementById('modal-tour').classList.add('aberto');
}

function encerrarTour() {
    document.getElementById('modal-tour').classList.remove('aberto');
    localStorage.setItem(`tour_visto_${usuarioLogadoUid}`, 'true');
}

function passoTour(direcao) {
    passoAtualTour += direcao;
    if (passoAtualTour >= etapasTour.length) {
        encerrarTour();
        return;
    }
    if (passoAtualTour < 0) {
        passoAtualTour = 0;
    }
    atualizarConteudoTour();
}

function atualizarConteudoTour() {
    const etapa = etapasTour[passoAtualTour];
    document.getElementById('tour-titulo').textContent = etapa.titulo;
    document.getElementById('tour-texto').textContent = etapa.texto;
    document.getElementById('tour-icone').innerHTML = `<i class="bi ${etapa.icone}"></i>`;

    for (let i = 0; i < etapasTour.length; i++) {
        const pt = document.getElementById(`ponto-${i}`);
        if (pt) pt.classList.toggle('ativo', i === passoAtualTour);
    }

    const btnVoltar = document.getElementById('btn-tour-voltar');
    const btnProximo = document.getElementById('btn-tour-proximo');
    if (btnVoltar) btnVoltar.style.display = passoAtualTour > 0 ? 'block' : 'none';
    if (btnProximo) {
        btnProximo.innerHTML = passoAtualTour === etapasTour.length - 1 
            ? 'Começar <i class="bi bi-check-lg"></i>' 
            : 'Próximo <i class="bi bi-arrow-right"></i>';
    }
}

function mascararCPF(cpfLimpo) {
    if (!cpfLimpo || cpfLimpo.length < 11) return "Não informado";
    return `${cpfLimpo.slice(0, 3)}.*****.${cpfLimpo.slice(9)}`;
}

function iniciarParticulas() {
    const canvas = document.getElementById('canvas-particulas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let largura = canvas.width = window.innerWidth;
    let altura = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        largura = canvas.width = window.innerWidth;
        altura = canvas.height = window.innerHeight;
    });

    const particulas = [];
    const quantidade = window.innerWidth < 768 ? 20 : 35;

    for (let i = 0; i < quantidade; i++) {
        particulas.push({
            x: Math.random() * largura,
            y: Math.random() * altura,
            raio: Math.random() * 2 + 0.8,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.3 + 0.1
        });
    }

    function animar() {
        ctx.clearRect(0, 0, largura, altura);
        const tema = document.documentElement.getAttribute('data-theme');
        
        let corBase = '59, 130, 246';
        if (tema === 'light') corBase = '37, 99, 235'; 
        if (tema === 'emerald') corBase = '16, 185, 129'; 

        particulas.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > largura) p.vx *= -1;
            if (p.y < 0 || p.y > altura) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${corBase}, ${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(animar);
    }

    animar();
}

const temasDisponiveis = ['dark', 'light', 'emerald'];

function aplicarTema(nomeTema) {
    document.documentElement.setAttribute('data-theme', nomeTema);
    localStorage.setItem('painel_tema_preferido', nomeTema);

    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.classList.toggle('ativo', btn.getAttribute('data-tema-btn') === nomeTema);
    });

    if (typeof ultimoDadosGrafico !== 'undefined' && ultimoDadosGrafico) {
        atualizarGraficosTopo(
            ultimoDadosGrafico.emprestado,
            ultimoDadosGrafico.recebido,
            ultimoDadosGrafico.pendente,
            ultimoDadosGrafico.entradas,
            ultimoDadosGrafico.gastos
        );
    }
}

function alternarTemaRapido() {
    const atual = document.documentElement.getAttribute('data-theme') || 'dark';
    const proximoIndex = (temasDisponiveis.indexOf(atual) + 1) % temasDisponiveis.length;
    const proximoTema = temasDisponiveis[proximoIndex];
    aplicarTema(proximoTema);

    const nomes = { dark: 'Noite Azul', light: 'Claro Executivo', emerald: 'Esmeralda Dark' };
    notificar(`Tema alterado para ${nomes[proximoTema]}`);
}

function notificar(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icones = {
        sucesso: 'bi-check-circle-fill',
        erro: 'bi-exclamation-octagon-fill',
        aviso: 'bi-exclamation-triangle-fill'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="bi ${icones[tipo] || icones.sucesso}"></i> <span>${mensagem}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function mostrarTela(nomeTela, elemento) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('visivel'));
    document.querySelectorAll('.item-menu').forEach(i => i.classList.remove('ativo'));

    const tela = document.getElementById(nomeTela);
    if (tela) tela.classList.add('visivel');
    if (elemento) elemento.classList.add('ativo');

    if (nomeTela === 'telaclientes') {
        voltarLista();
    }
}

window.onload = () => {
    const temaSalvo = localStorage.getItem('painel_tema_preferido') || 'dark';
    aplicarTema(temaSalvo);
    iniciarParticulas();

    ativarFormatacaoMoeda();
    ativarFormatacaoTelefone();
    ativarFormatacaoCPF();
    
    const dataInput = document.getElementById('fin-data');
    if (dataInput) dataInput.valueAsDate = new Date();
};

function ativarFormatacaoMoeda() {
    document.querySelectorAll('.input-moeda').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor === '') {
                e.target.value = '';
                return;
            }
            valor = (parseFloat(valor) / 100).toFixed(2);
            valor = valor.replace('.', ',');
            valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            e.target.value = valor;
        });
    });
}

function ativarFormatacaoTelefone() {
    ['modal-tel', 'input-meu-tel'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            else if (v.length > 0) v = `(${v}`;
            e.target.value = v;
        });
    });
}

function ativarFormatacaoCPF() {
    const el = document.getElementById('input-meu-cpf');
    if (!el) return;
    el.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = v;
    });
}

function converterMoedaParaFloat(valorStr) {
    if (!valorStr) return 0;
    if (typeof valorStr === 'number') return valorStr;
    let limpo = valorStr.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
}

function animarValorMonetario(elemento, valorFinal) {
    if (!elemento) return;
    let formatado = valorFinal.toFixed(2).replace('.', ',');
    formatado = formatado.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    elemento.textContent = `R$ ${formatado}`;
}

function toggleFormularioPerfil() {
    const painel = document.getElementById('painel-editar-perfil');
    const btn = document.getElementById('btn-toggle-perfil');
    if (!painel) return;
    if (painel.style.display === 'none') {
        painel.style.display = 'block';
        btn.innerHTML = '<i class="bi bi-x-lg"></i> Fechar Editor';
    } else {
        painel.style.display = 'none';
        btn.innerHTML = '<i class="bi bi-pencil-square"></i> Editar Meus Dados & Metas';
    }
}

function carregarMeuPerfil() {
    refUsuario('configuracao/perfil').on('value', snapshot => {
        const dados = snapshot.val() || {};
        const nome = dados.nome || usuarioLogadoEmail.split('@')[0] || "Usuário";
        const email = dados.email || usuarioLogadoEmail;
        const cpfLimpo = dados.cpf ? dados.cpf.replace(/\D/g, '') : "";
        const cpfFormatado = cpfLimpo.length === 11 ? mascararCPF(cpfLimpo) : "Não informado";
        const telefone = dados.telefone || "Não informado";
        const foto = dados.foto || "";
        const meta = Number(dados.metaFinanceira || 0);

        document.getElementById('mostrarNome').textContent = nome;
        document.getElementById('perfil-nome-exibir').textContent = nome;
        document.getElementById('perfil-email-exibir').textContent = email;
        document.getElementById('perfil-cpf-exibir').textContent = cpfFormatado;
        document.getElementById('perfil-tel-exibir').textContent = telefone;
        
        document.getElementById('input-meu-nome').value = dados.nome || "";
        document.getElementById('input-meu-cpf').value = dados.cpf || "";
        document.getElementById('input-meu-tel').value = dados.telefone || "";
        document.getElementById('input-minha-foto').value = foto;
        document.getElementById('input-meta-financeira').value = meta > 0 ? meta.toFixed(2).replace('.', ',') : "";

        let metaFormatada = meta.toFixed(2).replace('.', ',');
        metaFormatada = metaFormatada.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        document.getElementById('perfil-meta-exibir').textContent = `R$ ${metaFormatada}`;

        const htmlFoto = (foto && foto.startsWith('http')) ? `<img src="${foto}" alt="Avatar">` : `<i class="bi bi-person-fill"></i>`;
        document.getElementById('avatar-usuario').innerHTML = htmlFoto;
        document.getElementById('perfil-foto-grande').innerHTML = htmlFoto;
    });
}

function salvarMeuPerfil() {
    const nome = document.getElementById('input-meu-nome').value.trim();
    const cpf = document.getElementById('input-meu-cpf').value.trim();
    const telefone = document.getElementById('input-meu-tel').value.trim();
    const foto = document.getElementById('input-minha-foto').value.trim();
    const metaFinanceira = converterMoedaParaFloat(document.getElementById('input-meta-financeira').value);

    refUsuario('configuracao/perfil').update({
        nome,
        cpf,
        telefone,
        email: usuarioLogadoEmail,
        foto,
        metaFinanceira
    }).then(() => {
        notificar('Seus dados e meta foram atualizados!');
        toggleFormularioPerfil();
    }).catch(err => notificar("Erro: " + err.message, 'erro'));
}

function apagarMeusDados() {
    if (confirm("ATENÇÃO: Deseja apagar todos os clientes, investimentos e finanças da SUA conta?")) {
        Promise.all([
            refUsuario('pessoas').remove(),
            refUsuario('emprestimos').remove(),
            refUsuario('financas').remove()
        ]).then(() => {
            notificar("Os dados da sua conta foram limpos.", 'aviso');
        });
    }
}

let meuGrafico = null;
let meuGraficoPizza = null;
let ultimoDadosGrafico = null;

function carregarPainelGeral() {
    refUsuario('emprestimos').on('value', empSnap => {
        refUsuario('financas').on('value', finSnap => {
            let totalEmprestado = 0;
            let totalRecebido = 0;
            let totalSaidaEmprestimos = 0;

            empSnap.forEach(pessoaNode => {
                pessoaNode.forEach(empNode => {
                    const e = empNode.val();
                    const valPrincipal = Number(e.valor || 0);
                    totalEmprestado += Number(e.valorTotal || 0);
                    totalSaidaEmprestimos += valPrincipal;

                    if (e.parcelasDetalhes) {
                        e.parcelasDetalhes.forEach(p => { if (p.paga) totalRecebido += Number(p.valor || 0); });
                    }
                });
            });

            const saldoPendenteEmprestimos = Math.max(0, totalEmprestado - totalRecebido);

            let totalEntradasFin = 0;
            let totalGastosFin = 0;
            if (finSnap.exists()) {
                finSnap.forEach(doc => {
                    const f = doc.val();
                    const val = Number(f.valor || 0);
                    if (f.tipo === 'entrada') totalEntradasFin += val;
                    else totalGastosFin += val;
                });
            }

            const saldoEmContaCalculado = totalEntradasFin - totalGastosFin - totalSaidaEmprestimos;
            const saldoLiquidoTotal = saldoEmContaCalculado + saldoPendenteEmprestimos;
            
            let saldoStr = saldoEmContaCalculado.toFixed(2).replace('.', ',');
            saldoStr = `R$ ${saldoStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

            animarValorMonetario(document.getElementById('painel-saldo-liquido'), saldoLiquidoTotal);
            animarValorMonetario(document.getElementById('perfil-saldo-conta'), saldoEmContaCalculado);
            
            const elContaTopo = document.getElementById('painel-saldo-conta-topo');
            if (elContaTopo) elContaTopo.textContent = saldoStr;

            animarValorMonetario(document.getElementById('painel-emprestado'), totalEmprestado);
            animarValorMonetario(document.getElementById('painel-recebido'), totalRecebido);
            animarValorMonetario(document.getElementById('painel-pendente'), saldoPendenteEmprestimos);
            animarValorMonetario(document.getElementById('painel-total-entradas'), totalEntradasFin);
            animarValorMonetario(document.getElementById('painel-total-gastos'), totalGastosFin);

            ultimoDadosGrafico = {
                emprestado: totalEmprestado,
                recebido: totalRecebido,
                pendente: saldoPendenteEmprestimos,
                entradas: totalEntradasFin,
                gastos: totalGastosFin
            };

            atualizarGraficosTopo(totalEmprestado, totalRecebido, saldoPendenteEmprestimos, totalEntradasFin, totalGastosFin);
        });
    });
}

function atualizarGraficosTopo(emprestado, recebido, pendente, entradas, gastos) {
    const estilos = getComputedStyle(document.documentElement);
    const corTexto = estilos.getPropertyValue('--texto-claro').trim() || '#94a3b8';
    const corTextoPrincipal = estilos.getPropertyValue('--texto').trim() || '#f8fafc';
    const corGrid = estilos.getPropertyValue('--grid-grafico').trim() || '#233567';

    const canvasBar = document.getElementById('graficoPrincipal');
    if (canvasBar) {
        if (meuGrafico) meuGrafico.destroy();
        meuGrafico = new Chart(canvasBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Investido', 'Recebido', 'Pendente', 'Entradas', 'Gastos'],
                datasets: [{
                    data: [emprestado, recebido, pendente, entradas, gastos],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, ticks: { color: corTexto }, grid: { color: corGrid } }, 
                    x: { ticks: { color: corTexto }, grid: { display: false } } 
                }
            }
        });
    }

    const canvasPizza = document.getElementById('graficoPizza');
    if (canvasPizza) {
        if (meuGraficoPizza) meuGraficoPizza.destroy();
        meuGraficoPizza = new Chart(canvasPizza.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Entradas', 'Gastos'],
                datasets: [{
                    data: [entradas, gastos],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: { legend: { position: 'bottom', labels: { color: corTextoPrincipal, font: { size: 12, weight: '600' } } } }
            }
        });
    }
}

let pessoaAtualUid = null;
let empDetalheId = null;
let cachePessoas = [];

function carregarListaPessoas() {
    const container = document.getElementById('lista-pessoas');
    if (!container) return;

    refUsuario('pessoas').on('value', pessoasSnap => {
        if (!pessoasSnap.exists()) {
            cachePessoas = [];
            container.innerHTML = '<div class="vazio">Nenhum cliente cadastrado na sua conta.</div>';
            return;
        }

        refUsuario('emprestimos').once('value', empAllSnap => {
            cachePessoas = [];

            pessoasSnap.forEach(childSnap => {
                const p = childSnap.val();
                const uid = childSnap.key;
                const temFoto = p.foto && p.foto.startsWith('http');

                let pendentePessoa = 0;
                const empPessoaNode = empAllSnap.child(uid);
                if (empPessoaNode.exists()) {
                    empPessoaNode.forEach(eSnap => {
                        const e = eSnap.val();
                        let rest = Number(e.valorTotal || 0);
                        if (e.parcelasDetalhes) {
                            e.parcelasDetalhes.forEach(pObj => { if (pObj.paga) rest -= Number(pObj.valor || 0); });
                        }
                        pendentePessoa += Math.max(0, rest);
                    });
                }

                cachePessoas.push({ uid, p, temFoto, pendentePessoa });
            });

            renderizarGridClientes(cachePessoas);
        });
    });
}

function renderizarGridClientes(lista) {
    const container = document.getElementById('lista-pessoas');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<div class="vazio">Nenhum cliente encontrado.</div>';
        return;
    }

    container.innerHTML = '';
    lista.forEach(({ uid, p, temFoto, pendentePessoa }) => {
        let btnWp = '';
        if (p.telefone) {
            const tel = p.telefone.replace(/\D/g, '');
            const msg = encodeURIComponent(`Olá ${p.nome}, passando para conversar sobre o investimento.`);
            const wpFavicon = `<img src="https://www.google.com/s2/favicons?domain=whatsapp.com&sz=32" class="favicon-wp">`;
            btnWp = `<a href="https://wa.me/55${tel}?text=${msg}" target="_blank" class="btn-whatsapp" onclick="event.stopPropagation()">${wpFavicon} WhatsApp</a>`;
        }

        let valPendStr = pendentePessoa.toFixed(2).replace('.', ',');
        valPendStr = valPendStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        container.innerHTML += `
            <div class="card-pessoa" onclick="abrirPerfil('${uid}')">
                <div class="linha-principal">
                    <div class="mini-foto">${temFoto ? `<img src="${p.foto}" alt="${p.nome}">` : `<i class="bi bi-person-fill"></i>`}</div>
                    <div class="dados-pessoa">
                        <div class="nome">${p.nome}</div>
                        <div class="tel"><i class="bi bi-telephone"></i> ${p.telefone || 'Sem telefone'}</div>
                    </div>
                </div>
                <div class="card-pessoa-rodape">
                    <div class="valor-total">R$ ${valPendStr}</div>
                    ${btnWp}
                </div>
            </div>
        `;
    });
}

function filtrarClientes() {
    const termo = document.getElementById('input-busca-clientes').value.toLowerCase();
    const filtrados = cachePessoas.filter(item => item.p.nome.toLowerCase().includes(termo));
    renderizarGridClientes(filtrados);
}

function abrirPerfil(uid) {
    pessoaAtualUid = uid;

    refUsuario('pessoas/' + uid).once('value', snap => {
        if (!snap.exists()) return;
        const p = snap.val();

        const fotoDiv = document.getElementById('foto-perfil');
        if (fotoDiv) fotoDiv.innerHTML = (p.foto && p.foto.startsWith('http')) ? `<img src="${p.foto}" alt="${p.nome}">` : `<i class="bi bi-person-fill"></i>`;

        document.getElementById('nome-pessoa').textContent = p.nome;
        document.getElementById('tel-pessoa').textContent = p.telefone || '';
        document.getElementById('obs-pessoa').textContent = p.descricao || '';

        const cWp = document.getElementById('container-whatsapp');
        if (cWp) {
            const wpFavicon = `<img src="https://www.google.com/s2/favicons?domain=whatsapp.com&sz=32" class="favicon-wp">`;
            cWp.innerHTML = p.telefone ? `<a href="https://wa.me/55${p.telefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá ' + p.nome + ', contato referente ao investimento.')}" target="_blank" class="btn-whatsapp">${wpFavicon} Chamar no WhatsApp</a>` : '';
        }

        document.getElementById('secao-lista').classList.remove('visivel');
        document.getElementById('secao-perfil').classList.add('visivel');

        escutarDadosDaPessoa(uid);
        limparForm();
    });
}

function voltarLista() {
    if (pessoaAtualUid) {
        refUsuario('emprestimos/' + pessoaAtualUid).off();
    }
    pessoaAtualUid = null;
    const secPerfil = document.getElementById('secao-perfil');
    const secLista = document.getElementById('secao-lista');
    if (secPerfil) secPerfil.classList.remove('visivel');
    if (secLista) secLista.classList.add('visivel');
    carregarListaPessoas();
}

function escutarDadosDaPessoa(uid) {
    const containerHist = document.getElementById('lista-historico');

    refUsuario('emprestimos/' + uid).on('value', snapshot => {
        let totalEmp = 0, totalGeral = 0, pago = 0;
        let lista = [];

        snapshot.forEach(doc => {
            const e = doc.val();
            lista.push({ id: doc.key, ...e });

            totalEmp += Number(e.valor || 0);
            totalGeral += Number(e.valorTotal || 0);
            if (e.parcelasDetalhes) {
                e.parcelasDetalhes.forEach(p => { if (p.paga) pago += Number(p.valor || 0); });
            }
        });

        const aReceber = Math.max(0, totalGeral - pago);
        const progresso = totalGeral > 0 ? Math.round((pago / totalGeral) * 100) : 0;

        let strEmp = totalEmp.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let strRec = aReceber.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let strPago = pago.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        document.getElementById('total-emprestado').textContent = `R$ ${strEmp}`;
        document.getElementById('total-a-receber').textContent = `R$ ${strRec}`;
        document.getElementById('valor-pago').textContent = `R$ ${strPago}`;
        document.getElementById('porcentagem-pago').textContent = `${progresso}%`;
        document.getElementById('barra-progresso').style.width = `${progresso}%`;

        if (!containerHist) return;
        if (lista.length === 0) {
            containerHist.innerHTML = '<div class="vazio">Nenhum investimento registrado.</div>';
            return;
        }

        lista.sort((a, b) => new Date(b.data) - new Date(a.data));
        containerHist.innerHTML = '';

        lista.forEach(e => {
            let pagas = 0;
            if (e.parcelasDetalhes) e.parcelasDetalhes.forEach(p => { if (p.paga) pagas++; });

            let htmlP = '';
            if (e.parcelasDetalhes) {
                e.parcelasDetalhes.forEach(p => {
                    let vP = Number(p.valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    htmlP += `
                        <div class="parcela-chip ${p.paga ? 'paga' : 'pendente'}" onclick="alternarParcela('${e.id}', ${p.numero - 1})">
                            ${p.numero}ª: R$ ${vP}<br>
                            <small>${p.paga ? 'Recebida' : 'Pendente'}</small>
                        </div>
                    `;
                });
            }

            let vE = Number(e.valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            let vT = Number(e.valorTotal).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

            containerHist.innerHTML += `
                <div class="item-hist">
                    <div class="hist-topo">
                        <span style="font-size: 11px; color: var(--texto-claro);"><i class="bi bi-calendar3"></i> ${e.data}</span>
                        <button class="btn-opcoes-emp" onclick="abrirDetalhes('${e.id}')"><i class="bi bi-three-dots-vertical"></i></button>
                    </div>
                    <div class="hist-valores">
                        <span>Investido: R$ ${vE}</span>
                        <span class="hist-total">Total: R$ ${vT}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--texto-claro); margin-bottom: 4px;">Parcelas (${pagas}/${e.parcelas} recebidas):</div>
                    <div class="parcelas-grid-inline">${htmlP}</div>
                </div>
            `;
        });
    });
}

function salvarEmprestimo() {
    const valor = converterMoedaParaFloat(document.getElementById('valor').value);
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const juros = converterMoedaParaFloat(document.getElementById('juros').value);
    const data = document.getElementById('data').value;

    if (!valor || !parcelas || !data) {
        notificar('Preencha todos os campos obrigatórios.', 'aviso');
        return;
    }

    const valorTotal = valor + (valor * juros / 100);
    const valorParc = valorTotal / parcelas;
    const parcelasDetalhes = [];
    for (let i = 1; i <= parcelas; i++) {
        parcelasDetalhes.push({ numero: i, valor: valorParc, paga: false });
    }

    const editId = document.getElementById('editando-id').value;
    const baseRef = refUsuario('emprestimos/' + pessoaAtualUid);

    if (editId) {
        baseRef.child(editId).update({ valor, juros, parcelas, valorTotal, data, parcelasDetalhes }).then(() => {
            limparForm();
            notificar('Investimento atualizado com sucesso!');
        });
    } else {
        const novoEmpRef = baseRef.push();
        novoEmpRef.set({ id: novoEmpRef.key, valor, juros, parcelas, valorTotal, data, parcelasDetalhes }).then(() => {
            limparForm();
            notificar('Investimento registrado e descontado do saldo!');
        });
    }
}

function alternarParcela(empId, indexParcela) {
    const parcRef = refUsuario(`emprestimos/${pessoaAtualUid}/${empId}/parcelasDetalhes/${indexParcela}/paga`);
    parcRef.once('value', snap => { 
        const novoEstado = !snap.val();
        parcRef.set(novoEstado);
        notificar(novoEstado ? 'Parcela marcada como recebida!' : 'Parcela marcada como pendente.', novoEstado ? 'sucesso' : 'aviso');
    });
}

function salvarFinanca() {
    const tipo = document.getElementById('fin-tipo').value;
    const titulo = document.getElementById('fin-titulo').value;
    const valor = converterMoedaParaFloat(document.getElementById('fin-valor').value);
    const categoria = document.getElementById('fin-categoria').value;
    const data = document.getElementById('fin-data').value;

    if (!titulo || !valor || !data) {
        notificar("Preencha todos os campos do lançamento.", 'aviso');
        return;
    }

    const novoRef = refUsuario('financas').push();
    novoRef.set({
        id: novoRef.key,
        tipo,
        titulo,
        valor,
        categoria,
        data
    }).then(() => {
        document.getElementById('fin-titulo').value = '';
        document.getElementById('fin-valor').value = '';
        notificar('Lançamento registrado no extrato!');
    }).catch(err => notificar("Erro: " + err.message, 'erro'));
}

function carregarFinancas() {
    const container = document.getElementById('lista-financas');
    if (!container) return;

    refUsuario('financas').on('value', snapshot => {
        const elEnt = document.getElementById('fin-total-entradas');
        const elGas = document.getElementById('fin-total-gastos');

        if (!snapshot.exists()) {
            container.innerHTML = '<div class="vazio">Nenhum lançamento registrado na sua conta.</div>';
            if (elEnt) elEnt.textContent = 'R$ 0,00';
            if (elGas) elGas.textContent = 'R$ 0,00';
            return;
        }

        let totalEntradas = 0;
        let totalGastos = 0;
        let lista = [];

        snapshot.forEach(doc => {
            lista.push({ id: doc.key, ...doc.val() });
        });

        lista.sort((a, b) => new Date(b.data) - new Date(a.data));
        container.innerHTML = '';

        lista.forEach(f => {
            const valNum = Number(f.valor || 0);
            if (f.tipo === 'entrada') totalEntradas += valNum;
            else totalGastos += valNum;

            const corValor = f.tipo === 'entrada' ? 'var(--cor-verde)' : 'var(--cor-vermelho)';
            const sinal = f.tipo === 'entrada' ? '+' : '-';
            let vFStr = valNum.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

            container.innerHTML += `
                <div class="item-hist" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <strong>${f.titulo}</strong><br>
                        <small style="color: var(--texto-claro);">${f.categoria} • ${f.data}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: ${corValor}; font-weight: 700;">${sinal} R$ ${vFStr}</span>
                        <button class="btn-icone btn-apagar" onclick="excluirFinanca('${f.id}')" style="width: 34px; height: 34px; border-radius: 8px;" title="Excluir">
                            <i class="bi bi-trash-fill" style="font-size: 13px;"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        let strEnt = totalEntradas.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let strGas = totalGastos.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        if (elEnt) elEnt.textContent = `R$ ${strEnt}`;
        if (elGas) elGas.textContent = `R$ ${strGas}`;
    });
}

function excluirFinanca(id) {
    if (confirm("Deseja apagar este lançamento?")) {
        refUsuario('financas/' + id).remove().then(() => notificar('Lançamento removido.', 'aviso'));
    }
}

function abrirModalPessoa() {
    document.getElementById('modal-titulo').textContent = 'Novo Cliente';
    document.getElementById('modal-id').value = '';
    document.getElementById('modal-nome').value = '';
    document.getElementById('modal-tel').value = '';
    document.getElementById('modal-obs').value = '';
    document.getElementById('modal-foto').value = '';
    document.getElementById('modal-pessoa').classList.add('aberto');
}

function abrirModalEditarPessoa() {
    if (!pessoaAtualUid) return;
    refUsuario('pessoas/' + pessoaAtualUid).once('value', snap => {
        if (!snap.exists()) return;
        const p = snap.val();
        document.getElementById('modal-titulo').textContent = 'Editar Cliente';
        document.getElementById('modal-id').value = pessoaAtualUid;
        document.getElementById('modal-nome').value = p.nome || '';
        document.getElementById('modal-tel').value = p.telefone || '';
        document.getElementById('modal-obs').value = p.descricao || '';
        document.getElementById('modal-foto').value = p.foto || '';
        document.getElementById('modal-pessoa').classList.add('aberto');
    });
}

function fecharModal() { document.getElementById('modal-pessoa').classList.remove('aberto'); }

function salvarPessoa() {
    const nome = document.getElementById('modal-nome').value;
    const telefone = document.getElementById('modal-tel').value;
    const descricao = document.getElementById('modal-obs').value;
    const foto = document.getElementById('modal-foto').value;
    const id = document.getElementById('modal-id').value;

    if (!nome) { notificar('Digite o nome do cliente.', 'aviso'); return; }

    if (id) {
        refUsuario('pessoas/' + id).update({ uid: id, nome, telefone, descricao, foto }).then(() => {
            fecharModal();
            abrirPerfil(id);
            notificar('Dados do cliente atualizados!');
        });
    } else {
        const novoRef = refUsuario('pessoas').push();
        const novoUid = novoRef.key;
        novoRef.set({ uid: novoUid, nome, telefone, descricao, foto }).then(() => {
            fecharModal();
            notificar('Cliente cadastrado com sucesso!');
        });
    }
}

function confirmarExcluirPessoa() {
    if (!pessoaAtualUid) return;
    if (confirm('Deseja excluir este cliente e todos os investimentos vinculados?')) {
        Promise.all([
            refUsuario('pessoas/' + pessoaAtualUid).remove(),
            refUsuario('emprestimos/' + pessoaAtualUid).remove()
        ]).then(() => {
            voltarLista();
            notificar('Cliente removido.', 'aviso');
        });
    }
}

function abrirDetalhes(id) {
    empDetalheId = id;
    refUsuario(`emprestimos/${pessoaAtualUid}/${id}`).once('value', snap => {
        if (!snap.exists()) return;
        const e = snap.val();
        let vP = Number(e.valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let vT = Number(e.valorTotal).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        document.getElementById('conteudo-detalhes').innerHTML = `
            <p><strong>Data:</strong> ${e.data}</p>
            <p><strong>Valor Investido:</strong> R$ ${vP}</p>
            <p><strong>Retorno Esperado:</strong> ${e.juros}%</p>
            <p><strong>Total Retorno:</strong> R$ ${vT}</p>
        `;
        document.getElementById('modal-detalhes').classList.add('aberto');
    });
}

function fecharDetalhes() { document.getElementById('modal-detalhes').classList.remove('aberto'); empDetalheId = null; }

function editarSelecionado() {
    if (!empDetalheId) return;
    refUsuario(`emprestimos/${pessoaAtualUid}/${empDetalheId}`).once('value', snap => {
        if (!snap.exists()) return;
        const e = snap.val();
        fecharDetalhes();

        document.getElementById('editando-id').value = empDetalheId;
        document.getElementById('valor').value = e.valor.toFixed(2).replace('.', ',');
        document.getElementById('juros').value = e.juros;
        document.getElementById('parcelas').value = e.parcelas;
        document.getElementById('data').value = e.data;

        document.getElementById('titulo-form').innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Investimento';
        document.getElementById('btn-salvar').style.display = 'none';
        document.getElementById('btn-atualizar').style.display = 'inline-flex';
        document.getElementById('btn-cancelar').style.display = 'inline-flex';

        window.scrollTo({ top: 300, behavior: 'smooth' });
    });
}

function excluirSelecionado() {
    if (!empDetalheId) return;
    if (confirm('Deseja excluir este investimento?')) {
        refUsuario(`emprestimos/${pessoaAtualUid}/${empDetalheId}`).remove().then(() => {
            fecharDetalhes();
            notificar('Investimento excluído.', 'aviso');
        });
    }
}

function limparForm() {
    document.getElementById('valor').value = '';
    document.getElementById('juros').value = '';
    document.getElementById('parcelas').value = '';
    const inp = document.getElementById('data');
    if (inp) inp.valueAsDate = new Date();
    document.getElementById('editando-id').value = '';
    document.getElementById('titulo-form').innerHTML = '<i class="bi bi-plus-circle-fill"></i> Novo Investimento';
    document.getElementById('btn-salvar').style.display = 'inline-flex';
    document.getElementById('btn-atualizar').style.display = 'none';
    document.getElementById('btn-cancelar').style.display = 'none';
}