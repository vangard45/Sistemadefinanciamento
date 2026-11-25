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
const db = firebase.database();

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
    carregarMeuPerfil();
    carregarPainelGeral();
    carregarListaPessoas();
    carregarFinancas();
    ativarFormatacaoMoeda();
    
    const dataInput = document.getElementById('fin-data');
    if (dataInput) dataInput.valueAsDate = new Date();
};

// ==========================================
// MÁSCARA AUTOMÁTICA DE MOEDA
// ==========================================
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

function converterMoedaParaFloat(valorStr) {
    if (!valorStr) return 0;
    if (typeof valorStr === 'number') return valorStr;
    let limpo = valorStr.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
}

// ==========================================
// PERFIL E META
// ==========================================
function toggleFormularioPerfil() {
    const painel = document.getElementById('painel-editar-perfil');
    const btn = document.getElementById('btn-toggle-perfil');
    if (!painel) return;
    if (painel.style.display === 'none') {
        painel.style.display = 'block';
        btn.textContent = '✖️ Fechar Editor';
    } else {
        painel.style.display = 'none';
        btn.textContent = '✏️ Editar Perfil & Metas';
    }
}

function carregarMeuPerfil() {
    db.ref('configuracao/perfil').on('value', snapshot => {
        const dados = snapshot.val() || {};
        const nome = dados.nome || "Meu Painel";
        const foto = dados.foto || "";
        const meta = Number(dados.metaFinanceira || 0);

        const elNome = document.getElementById('mostrarNome');
        const elPerfilNome = document.getElementById('perfil-nome-exibir');
        if (elNome) elNome.textContent = nome;
        if (elPerfilNome) elPerfilNome.textContent = nome;
        
        const inNome = document.getElementById('input-meu-nome');
        const inFoto = document.getElementById('input-minha-foto');
        const inMeta = document.getElementById('input-meta-financeira');

        if (inNome) inNome.value = dados.nome || "";
        if (inFoto) inFoto.value = foto;
        if (inMeta) inMeta.value = meta > 0 ? meta.toFixed(2).replace('.', ',') : "";

        const elMetaExibir = document.getElementById('perfil-meta-exibir');
        if (elMetaExibir) elMetaExibir.textContent = `R$ ${meta.toFixed(2).replace('.', ',')}`;

        const avatarDiv = document.getElementById('avatar-usuario');
        const avatarGrande = document.getElementById('perfil-foto-grande');
        
        const htmlFoto = (foto && foto.startsWith('http')) ? `<img src="${foto}">` : '👤';
        if (avatarDiv) avatarDiv.innerHTML = htmlFoto;
        if (avatarGrande) avatarGrande.innerHTML = htmlFoto;
    });
}

function salvarMeuPerfil() {
    const nome = document.getElementById('input-meu-nome').value;
    const foto = document.getElementById('input-minha-foto').value;
    const metaFinanceira = converterMoedaParaFloat(document.getElementById('input-meta-financeira').value);

    db.ref('configuracao/perfil').update({ nome, foto, metaFinanceira }).then(() => {
        alert('✅ Perfil e Meta atualizados com sucesso!');
        toggleFormularioPerfil();
    }).catch(err => alert("Erro: " + err.message));
}

function apagarTudoFirebase() {
    if (confirm("⚠️ ATENÇÃO: Deseja apagar ABSOLUTAMENTE TUDO do banco de dados?")) {
        db.ref().remove().then(() => {
            alert("🗑️ Banco de dados limpo!");
            location.reload();
        });
    }
}

// ==========================================
// PAINEL GERAL & CÁLCULO DE SALDO COM EMPRÉSTIMOS
// ==========================================
let meuGrafico = null;
let meuGraficoPizza = null;

function carregarPainelGeral() {
    db.ref('emprestimos').on('value', empSnap => {
        db.ref('financas').on('value', finSnap => {
            let totalEmprestado = 0;
            let totalRecebido = 0;
            let totalSaidaEmprestimos = 0; // Soma dos valores principais emprestados tirados da conta

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

            // SALDO EM CONTA = Entradas - Gastos - Empréstimos feitos (permitindo negativo se faltar saldo)
            const saldoEmContaCalculado = totalEntradasFin - totalGastosFin - totalSaidaEmprestimos;
            const saldoLiquidoTotal = saldoEmContaCalculado + saldoPendenteEmprestimos;

            const elLiq = document.getElementById('painel-saldo-liquido');
            const elConta = document.getElementById('painel-saldo-conta');
            const elContaPerfil = document.getElementById('perfil-saldo-conta');
            const elContaTopo = document.getElementById('painel-saldo-conta-topo');
            const elEmp = document.getElementById('painel-emprestado');
            const elRec = document.getElementById('painel-recebido');
            const elPend = document.getElementById('painel-pendente');
            const elEnt = document.getElementById('painel-total-entradas');
            const elGas = document.getElementById('painel-total-gastos');

            const saldoStr = `R$ ${saldoEmContaCalculado.toFixed(2).replace('.', ',')}`;

            if (elLiq) elLiq.textContent = `R$ ${saldoLiquidoTotal.toFixed(2).replace('.', ',')}`;
            if (elConta) elConta.textContent = saldoStr;
            if (elContaPerfil) elContaPerfil.textContent = saldoStr;
            if (elContaTopo) elContaTopo.textContent = saldoStr;
            if (elEmp) elEmp.textContent = `R$ ${totalEmprestado.toFixed(2).replace('.', ',')}`;
            if (elRec) elRec.textContent = `R$ ${totalRecebido.toFixed(2).replace('.', ',')}`;
            if (elPend) elPend.textContent = `R$ ${saldoPendenteEmprestimos.toFixed(2).replace('.', ',')}`;
            if (elEnt) elEnt.textContent = `R$ ${totalEntradasFin.toFixed(2).replace('.', ',')}`;
            if (elGas) elGas.textContent = `R$ ${totalGastosFin.toFixed(2).replace('.', ',')}`;

            atualizarGraficosTopo(totalEmprestado, totalRecebido, saldoPendenteEmprestimos, totalEntradasFin, totalGastosFin);
        });
    });
}

function atualizarGraficosTopo(emprestado, recebido, pendente, entradas, gastos) {
    const canvasBar = document.getElementById('graficoPrincipal');
    if (canvasBar) {
        if (meuGrafico) meuGrafico.destroy();
        meuGrafico = new Chart(canvasBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Emprestado', 'Recebido', 'Pendente', 'Entradas', 'Gastos'],
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
                scales: { y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } }
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
                plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc', font: { size: 11 } } } }
            }
        });
    }
}

// ==========================================
// CLIENTES & EMPRÉSTIMOS
// ==========================================
let pessoaAtualUid = null;
let empDetalheId = null;

function carregarListaPessoas() {
    const container = document.getElementById('lista-pessoas');
    if (!container) return;

    db.ref('pessoas').on('value', pessoasSnap => {
        if (!pessoasSnap.exists()) {
            container.innerHTML = '<div class="vazio">📭 Nenhuma pessoa cadastrada.</div>';
            return;
        }

        db.ref('emprestimos').once('value', empAllSnap => {
            container.innerHTML = '';

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

                let btnWp = '';
                if (p.telefone) {
                    const tel = p.telefone.replace(/\D/g, '');
                    const msg = encodeURIComponent(`Olá ${p.nome}, passando para lembrar sobre o acerto do seu empréstimo.`);
                    btnWp = `<a href="https://wa.me/55${tel}?text=${msg}" target="_blank" class="btn-whatsapp" onclick="event.stopPropagation()">💬 WhatsApp</a>`;
                }

                container.innerHTML += `
                    <div class="card-pessoa" onclick="abrirPerfil('${uid}')">
                        <div class="linha-principal">
                            <div class="mini-foto">${temFoto ? `<img src="${p.foto}">` : '👤'}</div>
                            <div class="dados-pessoa">
                                <div class="nome">${p.nome}</div>
                                <div class="tel">${p.telefone || 'Sem telefone'}</div>
                            </div>
                        </div>
                        <div class="card-pessoa-rodape">
                            <div class="valor-total">R$ ${pendentePessoa.toFixed(2).replace('.', ',')}</div>
                            ${btnWp}
                        </div>
                    </div>
                `;
            });
        });
    });
}

function abrirPerfil(uid) {
    pessoaAtualUid = uid;

    db.ref('pessoas/' + uid).once('value', snap => {
        if (!snap.exists()) return;
        const p = snap.val();

        const fotoDiv = document.getElementById('foto-perfil');
        if (fotoDiv) fotoDiv.innerHTML = (p.foto && p.foto.startsWith('http')) ? `<img src="${p.foto}">` : '👤';

        document.getElementById('nome-pessoa').textContent = p.nome;
        document.getElementById('tel-pessoa').textContent = p.telefone || '';
        document.getElementById('obs-pessoa').textContent = p.descricao || '';

        const cWp = document.getElementById('container-whatsapp');
        if (cWp) cWp.innerHTML = p.telefone ? `<a href="https://wa.me/55${p.telefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá ' + p.nome + ', lembrete do empréstimo.')}" target="_blank" class="btn-whatsapp">💬 Chamar no WhatsApp</a>` : '';

        document.getElementById('secao-lista').classList.remove('visivel');
        document.getElementById('secao-perfil').classList.add('visivel');

        escutarDadosDaPessoa(uid);
        limparForm();
    });
}

function voltarLista() {
    if (pessoaAtualUid) {
        db.ref('emprestimos/' + pessoaAtualUid).off();
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

    db.ref('emprestimos/' + uid).on('value', snapshot => {
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

        const elTotEmp = document.getElementById('total-emprestado');
        const elRec = document.getElementById('total-a-receber');
        const elPago = document.getElementById('valor-pago');
        const elPorc = document.getElementById('porcentagem-pago');
        const elBarra = document.getElementById('barra-progresso');

        if (elTotEmp) elTotEmp.textContent = `R$ ${totalEmp.toFixed(2).replace('.', ',')}`;
        if (elRec) elRec.textContent = `R$ ${aReceber.toFixed(2).replace('.', ',')}`;
        if (elPago) elPago.textContent = `R$ ${pago.toFixed(2).replace('.', ',')}`;
        if (elPorc) elPorc.textContent = `${progresso}%`;
        if (elBarra) elBarra.style.width = `${progresso}%`;

        if (!containerHist) return;
        if (lista.length === 0) {
            containerHist.innerHTML = '<div class="vazio">📭 Nenhum empréstimo registrado.</div>';
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
                    htmlP += `
                        <div class="parcela-chip ${p.paga ? 'paga' : 'pendente'}" onclick="alternarParcela('${e.id}', ${p.numero - 1})">
                            ${p.numero}ª: R$ ${Number(p.valor).toFixed(2).replace('.', ',')}<br>
                            <small>${p.paga ? '✓ Paga' : 'Pendente'}</small>
                        </div>
                    `;
                });
            }

            containerHist.innerHTML += `
                <div class="item-hist">
                    <div class="hist-topo">
                        <span style="font-size: 11px; color: var(--texto-claro);">📅 Data: ${e.data}</span>
                        <button class="btn-opcoes-emp" onclick="abrirDetalhes('${e.id}')">⚙️</button>
                    </div>
                    <div class="hist-valores">
                        <span>Emprestado: R$ ${Number(e.valor).toFixed(2).replace('.', ',')}</span>
                        <span class="hist-total">Total: R$ ${Number(e.valorTotal).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--texto-claro); margin-bottom: 4px;">Parcelas (${pagas}/${e.parcelas} pagas):</div>
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
        alert('Preencha todos os campos!');
        return;
    }

    const valorTotal = valor + (valor * juros / 100);
    const valorParc = valorTotal / parcelas;
    const parcelasDetalhes = [];
    for (let i = 1; i <= parcelas; i++) {
        parcelasDetalhes.push({ numero: i, valor: valorParc, paga: false });
    }

    const editId = document.getElementById('editando-id').value;
    const baseRef = db.ref('emprestimos/' + pessoaAtualUid);

    if (editId) {
        baseRef.child(editId).update({ valor, juros, parcelas, valorTotal, data, parcelasDetalhes }).then(() => {
            limparForm();
            alert('✅ Empréstimo atualizado!');
        });
    } else {
        const novoEmpRef = baseRef.push();
        novoEmpRef.set({ id: novoEmpRef.key, valor, juros, parcelas, valorTotal, data, parcelasDetalhes }).then(() => {
            limparForm();
            alert('✅ Empréstimo registrado e descontado do saldo!');
        });
    }
}

function alternarParcela(empId, indexParcela) {
    const parcRef = db.ref(`emprestimos/${pessoaAtualUid}/${empId}/parcelasDetalhes/${indexParcela}/paga`);
    parcRef.once('value', snap => { parcRef.set(!snap.val()); });
}

// ==========================================
// FINANÇAS
// ==========================================
function salvarFinanca() {
    const tipo = document.getElementById('fin-tipo').value;
    const titulo = document.getElementById('fin-titulo').value;
    const valor = converterMoedaParaFloat(document.getElementById('fin-valor').value);
    const categoria = document.getElementById('fin-categoria').value;
    const data = document.getElementById('fin-data').value;

    if (!titulo || !valor || !data) {
        alert("Preencha todos os campos de finanças!");
        return;
    }

    const novoRef = db.ref('financas').push();
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
        alert('✅ Lançamento salvo!');
    }).catch(err => alert("Erro: " + err.message));
}

function carregarFinancas() {
    const container = document.getElementById('lista-financas');
    if (!container) return;

    db.ref('financas').on('value', snapshot => {
        const elEnt = document.getElementById('fin-total-entradas');
        const elGas = document.getElementById('fin-total-gastos');

        if (!snapshot.exists()) {
            container.innerHTML = '<div class="vazio">💰 Nenhum lançamento registrado.</div>';
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
            if (f.tipo === 'entrada') {
                totalEntradas += valNum;
            } else {
                totalGastos += valNum;
            }

            const corValor = f.tipo === 'entrada' ? 'var(--cor-verde)' : 'var(--cor-vermelho)';
            const sinal = f.tipo === 'entrada' ? '+' : '-';

            container.innerHTML += `
                <div class="item-hist" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <strong>${f.titulo}</strong><br>
                        <small style="color: var(--texto-claro);">📁 ${f.categoria} | 📅 ${f.data}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: ${corValor}; font-weight: 700;">${sinal} R$ ${valNum.toFixed(2).replace('.', ',')}</span>
                        <button class="btn-excluir" onclick="excluirFinanca('${f.id}')" style="padding: 4px 8px; font-size: 11px; width: auto;">🗑️</button>
                    </div>
                </div>
            `;
        });

        if (elEnt) elEnt.textContent = `R$ ${totalEntradas.toFixed(2).replace('.', ',')}`;
        if (elGas) elGas.textContent = `R$ ${totalGastos.toFixed(2).replace('.', ',')}`;
    });
}

function excluirFinanca(id) {
    if (confirm("Deseja apagar este lançamento?")) {
        db.ref('financas/' + id).remove();
    }
}

// ==========================================
// CRUD DE PESSOAS
// ==========================================
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
    if (!pessoaAtualUid) return;
    db.ref('pessoas/' + pessoaAtualUid).once('value', snap => {
        if (!snap.exists()) return;
        const p = snap.val();
        document.getElementById('modal-titulo').textContent = 'Editar Pessoa';
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

    if (!nome) { alert('Digite o nome!'); return; }

    if (id) {
        db.ref('pessoas/' + id).update({ uid: id, nome, telefone, descricao, foto }).then(() => {
            fecharModal();
            abrirPerfil(id);
            alert('✅ Atualizado!');
        });
    } else {
        const novoRef = db.ref('pessoas').push();
        const novoUid = novoRef.key;
        novoRef.set({ uid: novoUid, nome, telefone, descricao, foto }).then(() => {
            fecharModal();
            alert('✅ Pessoa cadastrada!');
        });
    }
}

function confirmarExcluirPessoa() {
    if (!pessoaAtualUid) return;
    if (confirm('⚠️ Deseja excluir esta pessoa e todos os empréstimos dela?')) {
        Promise.all([
            db.ref('pessoas/' + pessoaAtualUid).remove(),
            db.ref('emprestimos/' + pessoaAtualUid).remove()
        ]).then(() => {
            voltarLista();
            alert('✅ Excluído!');
        });
    }
}

function abrirDetalhes(id) {
    empDetalheId = id;
    db.ref(`emprestimos/${pessoaAtualUid}/${id}`).once('value', snap => {
        if (!snap.exists()) return;
        const e = snap.val();
        document.getElementById('conteudo-detalhes').innerHTML = `
            <p><strong>Data:</strong> ${e.data}</p>
            <p><strong>Valor:</strong> R$ ${Number(e.valor).toFixed(2).replace('.', ',')}</p>
            <p><strong>Juros:</strong> ${e.juros}%</p>
            <p><strong>Total Geral:</strong> R$ ${Number(e.valorTotal).toFixed(2).replace('.', ',')}</p>
        `;
        document.getElementById('modal-detalhes').classList.add('aberto');
    });
}

function fecharDetalhes() { document.getElementById('modal-detalhes').classList.remove('aberto'); empDetalheId = null; }

function editarSelecionado() {
    if (!empDetalheId) return;
    db.ref(`emprestimos/${pessoaAtualUid}/${empDetalheId}`).once('value', snap => {
        if (!snap.exists()) return;
        const e = snap.val();
        fecharDetalhes();

        document.getElementById('editando-id').value = empDetalheId;
        document.getElementById('valor').value = e.valor.toFixed(2).replace('.', ',');
        document.getElementById('juros').value = e.juros;
        document.getElementById('parcelas').value = e.parcelas;
        document.getElementById('data').value = e.data;

        document.getElementById('titulo-form').textContent = '✏️ Editar Empréstimo';
        document.getElementById('btn-salvar').style.display = 'none';
        document.getElementById('btn-atualizar').style.display = 'inline-block';
        document.getElementById('btn-cancelar').style.display = 'inline-block';

        window.scrollTo({ top: 300, behavior: 'smooth' });
    });
}

function excluirSelecionado() {
    if (!empDetalheId) return;
    if (confirm('⚠️ Deseja excluir este empréstimo?')) {
        db.ref(`emprestimos/${pessoaAtualUid}/${empDetalheId}`).remove().then(() => {
            fecharDetalhes();
            alert('✅ Empréstimo excluído!');
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
    document.getElementById('titulo-form').textContent = 'Novo Empréstimo';
    document.getElementById('btn-salvar').style.display = 'inline-block';
    document.getElementById('btn-atualizar').style.display = 'none';
    document.getElementById('btn-cancelar').style.display = 'none';
}