//farebase
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

  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore();

  function buscarMeusDados() {
    const usuario = firebase.auth().currentUser;
    
    if (usuario) {
        db.collection("usuario").doc(usuario.uid).get()
        .then(function(doc) {
            if (doc.exists) {
                const dados = doc.data();
                document.getElementById('mostrarNome').textContent = dados.nome;
                document.getElementById('mostrarEmail').textContent = dados.email;
            }
        });
    }
}

firebase.auth().onAuthStateChanged(buscarMeusDados);


//firebase finalizado 


function mostrarTela(nomeTela) {
    // 1. Esconde TODAS as telas
    const todasAsTelas = document.querySelectorAll('.tela');
    todasAsTelas.forEach(function(tela) {
        tela.classList.remove('visivel');
    });

    // 2. Remove o destaque de todos os itens do menu
    const todosOsItens = document.querySelectorAll('.item-menu');
    todosOsItens.forEach(function(item) {
        item.classList.remove('ativo');
    });

    // 3. Mostra a tela que foi clicada
    const telaEscolhida = document.getElementById(nomeTela);
    if (telaEscolhida) {
        telaEscolhida.classList.add('visivel');
    }

    // 4. Destaca o item clicado
    event.currentTarget.classList.add('ativo');
}

// DADOS DO PAINEL — você pode mudar esses valores depois
let dados = {
    entradas: 5000.00,
    saidas: 3100.00
};

// Atualiza os números nas caixinhas
function atualizarPainel() {
    const saldo = dados.entradas - dados.saidas;
    
    document.getElementById('total-entradas').textContent = 
        'R$ ' + dados.entradas.toFixed(2).replace('.', ',');
    
    document.getElementById('total-saidas').textContent = 
        'R$ ' + dados.saidas.toFixed(2).replace('.', ',');
    
    document.getElementById('saldo-final').textContent = 
        'R$ ' + saldo.toFixed(2).replace('.', ',');
    
    criarGrafico();
}

// CRIA O GRÁFICO
let meuGrafico = null;

function criarGrafico() {
    const canvas = document.getElementById('graficoPrincipal');
    if (!canvas) return;
    
    // Destrói o gráfico antigo se existir
    if (meuGrafico) meuGrafico.destroy();
    
    const ctx = canvas.getContext('2d');
    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Entradas', 'Saídas', 'Saldo'],
            datasets: [{
                label: 'Valor (R$)',
                data: [dados.entradas, dados.saidas, dados.entradas - dados.saidas],
                backgroundColor: [
                    '#38a169',   // verde — entradas
                    '#e53e3e',   // vermelho — saídas
                    '#3182ce'    // azul — saldo
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(valor) {
                            return 'R$ ' + valor.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Carrega os dados quando a página abre
window.onload = atualizarPainel;

//TELA DE CLIENTES
let pessoaAtualId = null;
let empDetalheId = null;

if (!localStorage.getItem('pessoas')) {
    localStorage.setItem('pessoas', JSON.stringify([]));
}
if (!localStorage.getItem('emprestimos')) {
    localStorage.setItem('emprestimos', JSON.stringify([]));
}

atualizarListaPessoas();

function atualizarListaPessoas() {
    const pessoas = JSON.parse(localStorage.getItem('pessoas'));
    const container = document.getElementById('lista-pessoas');
    
    if (pessoas.length === 0) {
        container.innerHTML = '<div class="vazio">📭 Nenhuma pessoa cadastrada ainda.<br>Clique em "Nova Pessoa" para começar!</div>';
        return;
    }

    container.innerHTML = '';
    pessoas.forEach(p => {
        const total = calcularTotalPorPessoa(p.id);
        const temFoto = p.foto && p.foto.startsWith('http');
        
        // Botão WhatsApp rápido na tela inicial também se tiver telefone
        let botaoWpCard = '';
        if (p.telefone) {
            const telLimpo = p.telefone.replace(/\D/g, '');
            const msg = encodeURIComponent(`Olá ${p.nome}, passando para lembrar sobre o acerto do seu empréstimo.`);
            botaoWpCard = `<a href="https://wa.me/55${telLimpo}?text=${msg}" target="_blank" class="btn-whatsapp" onclick="event.stopPropagation()">💬 WhatsApp</a>`;
        }
        
        container.innerHTML += `
            <div class="card-pessoa" onclick="abrirPerfil(${p.id})">
                <div class="linha-principal">
                    <div class="mini-foto">
                        ${temFoto ? `<img src="${p.foto}" alt="${p.nome}">` : '👤'}
                    </div>
                    <div class="dados-pessoa">
                        <div class="nome">${p.nome}</div>
                        <div class="tel">${p.telefone || 'telefone sem'}</div>
                    </div>
                </div>
                <div class="card-pessoa-rodape">
                    <div class="valor-total"> R$ ${total.toFixed(2).replace('.', ',')}</div>
                    ${botaoWpCard}
                </div>
            </div>
        `;
    });
}

function calcularTotalPorPessoa(pessoaId) {
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const listaPessoa = emp.filter(e => Number(e.pessoaId) === Number(pessoaId));
    
    let aReceberTotal = 0;
    listaPessoa.forEach(e => {
        let totalEmprestimo = e.valorTotal;
        if (e.parcelasDetalhes) {
            e.parcelasDetalhes.forEach(p => {
                if (p.paga) totalEmprestimo -= p.valor;
            });
        }
        aReceberTotal += Math.max(0, totalEmprestimo);
    });
    return aReceberTotal;
}

function abrirPerfil(id) {
    pessoaAtualId = Number(id);
    const pessoas = JSON.parse(localStorage.getItem('pessoas'));
    const pessoa = pessoas.find(p => Number(p.id) === pessoaAtualId);
    
    if (!pessoa) return;

    const fotoDiv = document.getElementById('foto-perfil');
    if (pessoa.foto && pessoa.foto.startsWith('http')) {
        fotoDiv.innerHTML = `<img src="${pessoa.foto}" alt="${pessoa.nome}">`;
    } else {
        fotoDiv.innerHTML = '👤';
    }
    
    document.getElementById('nome-pessoa').textContent = pessoa.nome;
    
    document.getElementById('obs-pessoa').textContent = pessoa.observacoes || '';
    
    // BOTÃO DO WHATSAPP NO PERFIL
    const containerWp = document.getElementById('container-whatsapp');
    if (pessoa.telefone) {
        const telLimpo = pessoa.telefone.replace(/\D/g, '');
        const mensagem = encodeURIComponent(`Olá ${pessoa.nome}, passando para lembrar sobre o acerto do seu empréstimo.`);
        containerWp.innerHTML = `
            <a href="https://wa.me/55${telLimpo}?text=${mensagem}" target="_blank" class="btn-whatsapp">
                💬 Chamar no WhatsApp
            </a>
        `;
    } else {
        containerWp.innerHTML = '';
    }
    
    document.querySelector('#secao-lista').classList.remove('visivel');
    document.querySelector('#secao-perfil').classList.add('visivel');
    
    carregarResumo();
    carregarHistoricoPessoa();
    limparForm();
    document.getElementById('data').valueAsDate = new Date();
}

function voltarLista() {
    pessoaAtualId = null;
    document.querySelector('#secao-perfil').classList.remove('visivel');
    document.querySelector('#secao-lista').classList.add('visivel');
    atualizarListaPessoas();
}

function carregarResumo() {
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const lista = emp.filter(e => Number(e.pessoaId) === Number(pessoaAtualId));
    
    const totalEmprestado = lista.reduce((soma, e) => soma + e.valor, 0);
    const totalAReceberGeral = lista.reduce((soma, e) => soma + e.valorTotal, 0);
    
    let valorPago = 0;
    lista.forEach(item => {
        if (item.parcelasDetalhes) {
            item.parcelasDetalhes.forEach(p => { if (p.paga) valorPago += p.valor; });
        }
    });
    
    const aReceberReal = Math.max(0, totalAReceberGeral - valorPago);
    const porcentagem = totalAReceberGeral > 0 ? Math.round((valorPago / totalAReceberGeral) * 100) : 0;
    
    document.getElementById('total-emprestado').textContent = `R$ ${totalEmprestado.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-a-receber').textContent = `R$ ${aReceberReal.toFixed(2).replace('.', ',')}`;
    document.getElementById('valor-pago').textContent = `R$ ${valorPago.toFixed(2).replace('.', ',')}`;
    document.getElementById('porcentagem-pago').textContent = `${porcentagem}%`;
    document.getElementById('barra-progresso').style.width = `${porcentagem}%`;
}

function carregarHistoricoPessoa() {
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const lista = emp.filter(e => Number(e.pessoaId) === Number(pessoaAtualId));
    const container = document.getElementById('lista-historico');
    
    if (lista.length === 0) {
        container.innerHTML = '<div class="vazio">📭 Nenhum empréstimo registrado para essa pessoa.</div>';
        return;
    }
    
    lista.sort((a, b) => new Date(b.data) - new Date(a.data));
    container.innerHTML = '';
    
    lista.forEach(e => {
        const data = new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        let pagas = 0;
        if (e.parcelasDetalhes) {
            e.parcelasDetalhes.forEach(p => { if (p.paga) pagas++; });
        }
        const totalParcelas = e.parcelas || 1;
        
        let htmlParcelas = '';
        if (e.parcelasDetalhes) {
            e.parcelasDetalhes.forEach(p => {
                htmlParcelas += `
                    <div class="parcela-chip ${p.paga ? 'paga' : 'pendente'}" 
                         onclick="alternarParcela(${e.id}, ${p.numero})" 
                         title="Clique para pagar/desfazer">
                        ${p.numero}ª: R$ ${p.valor.toFixed(2).replace('.', ',')}<br>
                        <small>${p.paga ? '✓ Paga' : 'Pendente'}</small>
                    </div>
                `;
            });
        }
        
        container.innerHTML += `
            <div class="item-hist">
                <div class="hist-topo">
                    <span class="hist-data">📅 Data: ${data}</span>
                    <button class="btn-opcoes-emp" onclick="abrirDetalhes(${e.id})" title="Gerenciar Empréstimo">⚙️</button>
                </div>
                <div class="hist-valores">
                    <span>Emprestado: R$ ${e.valor.toFixed(2).replace('.', ',')}</span>
                    <span class="hist-total">Total: R$ ${e.valorTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">
                    Parcelas (${pagas}/${totalParcelas} pagas):
                </div>
                <div class="parcelas-grid-inline">
                    ${htmlParcelas}
                </div>
            </div>
        `;
    });
}

function salvarEmprestimo() {
    const valor = parseFloat(document.getElementById('valor').value);
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const juros = parseFloat(document.getElementById('juros').value) || 0;
    const data = document.getElementById('data').value;
    
    if (!valor || !parcelas || !data) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const valorTotal = valor + (valor * juros / 100);
    const valorParcela = valorTotal / parcelas;
    
    const parcelasDetalhes = [];
    for (let i = 1; i <= parcelas; i++) {
        parcelasDetalhes.push({ numero: i, valor: valorParcela, paga: false });
    }
    
    const novo = {
        id: Date.now(),
        pessoaId: pessoaAtualId,
        valor: valor,
        juros: juros,
        parcelas: parcelas,
        valorTotal: valorTotal,
        data: data,
        parcelasDetalhes: parcelasDetalhes
    };
    
    const lista = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    lista.push(novo);
    localStorage.setItem('emprestimos', JSON.stringify(lista));
    
    limparForm();
    carregarResumo();
    carregarHistoricoPessoa();
    atualizarListaPessoas();
    alert('✅ Empréstimo registrado!');
}

function limparForm() {
    document.getElementById('valor').value = '';
    document.getElementById('juros').value = '';
    document.getElementById('parcelas').value = '';
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('editando-id').value = '';
    document.getElementById('titulo-form').textContent = '➕ Novo Empréstimo';
    document.getElementById('btn-salvar').style.display = 'block';
    document.getElementById('btn-atualizar').style.display = 'none';
    document.getElementById('btn-cancelar').style.display = 'none';
}

function cancelarEdicao() {
    limparForm();
}

function alternarParcela(emprestimoId, numeroParcela) {
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const emprestimo = emp.find(item => Number(item.id) === Number(emprestimoId));
    
    if (emprestimo && emprestimo.parcelasDetalhes) {
        const parcela = emprestimo.parcelasDetalhes.find(p => p.numero === numeroParcela);
        if (parcela) {
            parcela.paga = !parcela.paga;
            localStorage.setItem('emprestimos', JSON.stringify(emp));
            
            carregarResumo();
            carregarHistoricoPessoa();
            atualizarListaPessoas();
        }
    }
}

function abrirDetalhes(id) {
    empDetalheId = Number(id);
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const e = emp.find(item => Number(item.id) === empDetalheId);
    if (!e) return;
    
    const data = new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR');
    document.getElementById('conteudo-detalhes').innerHTML = `
        <p><strong>Data:</strong> ${data}</p>
        <p><strong>Valor emprestado:</strong> R$ ${e.valor.toFixed(2).replace('.', ',')}</p>
        <p><strong>Juros:</strong> ${e.juros.toFixed(2)}%</p>
        <p><strong>Total geral:</strong> R$ ${e.valorTotal.toFixed(2).replace('.', ',')}</p>
    `;
    document.getElementById('modal-detalhes').classList.add('aberto');
}

function fecharDetalhes() {
    document.getElementById('modal-detalhes').classList.remove('aberto');
    empDetalheId = null;
}

function editarSelecionado() {
    if (!empDetalheId) return;
    fecharDetalhes();
    const emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const e = emp.find(item => Number(item.id) === empDetalheId);
    if (!e) return;

    document.getElementById('editando-id').value = e.id;
    document.getElementById('valor').value = e.valor;
    document.getElementById('juros').value = e.juros;
    document.getElementById('parcelas').value = e.parcelas;
    document.getElementById('data').value = e.data;
    
    document.getElementById('titulo-form').textContent = '✏️ Editar Empréstimo';
    document.getElementById('btn-salvar').style.display = 'none';
    document.getElementById('btn-atualizar').style.display = 'block';
    document.getElementById('btn-cancelar').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function atualizarEmprestimo() {
    const id = parseInt(document.getElementById('editando-id').value);
    const valor = parseFloat(document.getElementById('valor').value);
    const juros = parseFloat(document.getElementById('juros').value) || 0;
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const data = document.getElementById('data').value;
    
    if (!valor || !parcelas || !data) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const valorTotal = valor + (valor * juros / 100);
    const valorParcela = valorTotal / parcelas;
    
    let emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
    const emprestimo = emp.find(e => Number(e.id) === id);
    if (!emprestimo) return;

    let parcelasDetalhes = emprestimo.parcelasDetalhes || [];
    if (parcelasDetalhes.length !== parcelas) {
        parcelasDetalhes = [];
        for (let i = 1; i <= parcelas; i++) {
            parcelasDetalhes.push({ numero: i, valor: valorParcela, paga: false });
        }
    } else {
        parcelasDetalhes.forEach(p => p.valor = valorParcela);
    }
    
    emp = emp.map(e => Number(e.id) === id ? {...e, valor, juros, parcelas, valorTotal, data, parcelasDetalhes} : e);
    localStorage.setItem('emprestimos', JSON.stringify(emp));
    
    limparForm();
    carregarResumo();
    carregarHistoricoPessoa();
    atualizarListaPessoas();
    alert('✅ Empréstimo atualizado!');
}

function excluirSelecionado() {
    if (!empDetalheId) return;
    if (confirm('⚠️ Tem certeza que deseja excluir este empréstimo?')) {
        let emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
        emp = emp.filter(e => Number(e.id) !== empDetalheId);
        localStorage.setItem('emprestimos', JSON.stringify(emp));
        fecharDetalhes();
        carregarResumo();
        carregarHistoricoPessoa();
        atualizarListaPessoas();
    }
}

function abrirModalPessoa() {
    document.getElementById('modal-titulo').textContent = 'Nova Pessoa';
    document.getElementById('modal-id').value = '';
    document.getElementById('modal-nome').value = '';
    document.getElementById('modal-tel').value = '';
    document.getElementById('modal-obs').value = '';
    document.getElementById('modal-foto').value = '';
    document.getElementById('modal-pessoa').classList.add('aberto');
}

function abrirModalEditarPessoa() {
    const pessoas = JSON.parse(localStorage.getItem('pessoas'));
    const pessoa = pessoas.find(p => Number(p.id) === Number(pessoaAtualId));
    if (!pessoa) return;

    document.getElementById('modal-titulo').textContent = 'Editar Pessoa';
    document.getElementById('modal-id').value = pessoa.id;
    document.getElementById('modal-nome').value = pessoa.nome;
    document.getElementById('modal-tel').value = pessoa.telefone || '';
    document.getElementById('modal-obs').value = pessoa.observacoes || '';
    document.getElementById('modal-foto').value = pessoa.foto || '';
    document.getElementById('modal-pessoa').classList.add('aberto');
}

function fecharModal() {
    document.getElementById('modal-pessoa').classList.remove('aberto');
}

function salvarPessoa() {
    const nome = document.getElementById('modal-nome').value;
    const telefone = document.getElementById('modal-tel').value;
    const obs = document.getElementById('modal-obs').value;
    const foto = document.getElementById('modal-foto').value;
    const id = document.getElementById('modal-id').value;
    
    if (!nome) {
        alert('Digite o nome da pessoa!');
        return;
    }
    
    let pessoas = JSON.parse(localStorage.getItem('pessoas'));
    
    if (id) {
        pessoas = pessoas.map(p => Number(p.id) === Number(id) ? {...p, nome, telefone, observacoes: obs, foto} : p);
        alert('✅ Pessoa atualizada!');
    } else {
        pessoas.push({ id: Date.now(), nome, telefone, observacoes: obs, foto });
        alert('✅ Pessoa cadastrada!');
    }
    
    localStorage.setItem('pessoas', JSON.stringify(pessoas));
    fecharModal();
    atualizarListaPessoas();
    if (pessoaAtualId) abrirPerfil(pessoaAtualId);
}

function confirmarExcluirPessoa() {
    if (confirm('⚠️ Tem certeza que deseja excluir esta pessoa? Os empréstimos dela também serão removidos.')) {
        let pessoas = JSON.parse(localStorage.getItem('pessoas'));
        pessoas = pessoas.filter(p => Number(p.id) !== Number(pessoaAtualId));
        localStorage.setItem('pessoas', JSON.stringify(pessoas));
        
        let emp = JSON.parse(localStorage.getItem('emprestimos') || '[]');
        emp = emp.filter(e => Number(e.pessoaId) !== Number(pessoaAtualId));
        localStorage.setItem('emprestimos', JSON.stringify(emp));
        
        voltarLista();
        alert('✅ Pessoa excluída!');
    }
}



