// ==========================================
// 1. INICIALIZAÇÃO DO FIREBASE
// ==========================================
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
const db = firebase.firestore();

// ==========================================
// 2. MENU HAMBÚRGUER & NAVEGAÇÃO
// ==========================================
const menuLateral = document.getElementById('menuLateral');
const btnToggle = document.getElementById('btnToggle');

if (btnToggle && menuLateral) {
    btnToggle.addEventListener('click', () => {
        menuLateral.classList.toggle('aberto');
    });
}

function mostrarTela(nomeTela, elemento) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('visivel'));
    document.querySelectorAll('.item-menu').forEach(i => i.classList.remove('ativo'));

    const tela = document.getElementById(nomeTela);
    if (tela) tela.classList.add('visivel');

    if (elemento) {
        elemento.classList.add('ativo');
    }

    if (menuLateral && window.innerWidth < 768) {
        menuLateral.classList.remove('aberto');
    }

    if (nomeTela === 'telaclientes') {
        voltarLista();
    }
}

// ==========================================
// 3. INICIALIZAÇÃO AUTOMÁTICA
// ==========================================
window.onload = () => {
    carregarMeuPerfil();
    carregarPainelGeral();
    carregarListaPessoas();
    carregarCompromissos();
};

// ==========================================
// 4. PERFIL DO USUÁRIO
// ==========================================
function carregarMeuPerfil() {
    db.collection("configuracao").doc("perfil").get().then(doc => {
        if (doc.exists) {
            const dados = doc.data();
            const nome = dados.nome || "Meu Painel";
            const foto = dados.foto || "";

            document.getElementById('mostrarNome').textContent = nome;
            document.getElementById('input-meu-nome').value = dados.nome || "";
            document.getElementById('input-minha-foto').value = foto;

            const avatarDiv = document.getElementById('avatar-usuario');
            if (foto && foto.startsWith('http')) {
                avatarDiv.innerHTML = `<img src="${foto}" alt="Avatar">`;
            } else {
                avatarDiv.innerHTML = '👤';
            }
        }
    }).catch(err => console.error("Erro ao carregar perfil:", err));
}

function salvarMeuPerfil() {
    const nome = document.getElementById('input-meu-nome').value;
    const foto = document.getElementById('input-minha-foto').value;

    db.collection("configuracao").doc("perfil").set({ nome, foto }).then(() => {
        carregarMeuPerfil();
        alert('✅ Perfil salvo!');
    }).catch(err => alert("Erro: " + err.message));
}

// ==========================================
// 5. PAINEL GERAL (SOMAS DE TODAS AS SUBPASTAS)
// ==========================================
let meuGrafico = null;

function carregarPainelGeral() {
    // Busca todas as pessoas e soma o histórico de cada uma de forma organizada
    db.collection("pessoas").onSnapshot(async snapshot => {
        let totalEmprestado = 0;
        let totalRecebido = 0;

        for (let pessoaDoc of snapshot.docs) {
            const pId = pessoaDoc.id;
            const empSnap = await db.collection("pessoas").doc(pId).collection("emprestimos").get();
            
            empSnap.forEach(doc => {
                const e = doc.data();
                totalEmprestado += Number(e.valorTotal || 0);
                if (e.parcelasDetalhes) {
                    e.parcelasDetalhes.forEach(p => {
                        if (p.paga) totalRecebido += Number(p.valor || 0);
                    });
                }
            });
        }

        const saldoPendente = Math.max(0, totalEmprestado - totalRecebido);

        document.getElementById('painel-emprestado').textContent = `R$ ${totalEmprestado.toFixed(2).replace('.', ',')}`;
        document.getElementById('painel-recebido').textContent = `R$ ${totalRecebido.toFixed(2).replace('.', ',')}`;
        document.getElementById('painel-pendente').textContent = `R$ ${saldoPendente.toFixed(2).replace('.', ',')}`;

        atualizarGraficoPainel(totalEmprestado, totalRecebido, saldoPendente);
    });
}

function atualizarGraficoPainel(emprestado, recebido, pendente) {
    const canvas = document.getElementById('graficoPrincipal');
    if (!canvas) return;

    if (meuGrafico) meuGrafico.destroy();

    meuGrafico = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Total a Receber', 'Já Recebido', 'Pendente'],
            datasets: [{
                data: [emprestado, recebido, pendente],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v.toFixed(0) } } }
        }
    });
}

// ==========================================
// 6. CLIENTES & SUBCOLEÇÕES (PASTINHAS INDIVIDUAIS)
// ==========================================
let pessoaAtualId = null;
let empDetalheId = null;

function carregarListaPessoas() {
    const container = document.getElementById('lista-pessoas');
    if (!container) return;

    db.collection("pessoas").onSnapshot(async snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<div class="vazio">📭 Nenhuma pessoa cadastrada.<br>Clique em "Nova Pessoa" para iniciar!</div>';
            return;
        }

        container.innerHTML = '';
        
        for (let doc of snapshot.docs) {
            const p = doc.data();
            const pId = doc.id;
            const temFoto = p.foto && p.foto.startsWith('http');

            // Puxa da pastinha específica desta pessoa
            const empSnap = await db.collection("pessoas").doc(pId).collection("emprestimos").get();
            let pendentePessoa = 0;
            
            empSnap.forEach(eDoc => {
                const e = eDoc.data();
                let rest = e.valorTotal;
                if (e.parcelasDetalhes) {
                    e.parcelasDetalhes.forEach(pObj => { if (pObj.paga) rest -= pObj.valor; });
                }
                pendentePessoa += Math.max(0, rest);
            });

            let btnWp = '';
            if (p.telefone) {
                const tel = p.telefone.replace(/\D/g, '');
                const msg = encodeURIComponent(`Olá ${p.nome}, passando para lembrar sobre o acerto do seu empréstimo.`);
                btnWp = `<a href="https://wa.me/55${tel}?text=${msg}" target="_blank" class="btn-whatsapp" onclick="event.stopPropagation()">💬 WhatsApp</a>`;
            }

            container.innerHTML += `
                <div class="card-pessoa" onclick="abrirPerfil('${pId}')">
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
        }
    });
}

function abrirPerfil(pId) {
    pessoaAtualId = pId;
    db.collection("pessoas").doc(pId).get().then(doc => {
        if (!doc.exists) return;
        const p = doc.data();

        const fotoDiv = document.getElementById('foto-perfil');
        fotoDiv.innerHTML = (p.foto && p.foto.startsWith('http')) ? `<img src="${p.foto}">` : '👤';

        document.getElementById('nome-pessoa').textContent = p.nome;
        document.getElementById('tel-pessoa').textContent = p.telefone || '';
        document.getElementById('obs-pessoa').textContent = p.observacoes || '';

        const cWp = document.getElementById('container-whatsapp');
        cWp.innerHTML = p.telefone ? `<a href="https://wa.me/55${p.telefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá ' + p.nome + ', lembrete do empréstimo.')}" target="_blank" class="btn-whatsapp">💬 Chamar no WhatsApp</a>` : '';

        document.getElementById('secao-lista').classList.remove('visivel');
        document.getElementById('secao-perfil').classList.add('visivel');

        carregarResumoPerfil(pId);
        carregarHistoricoPerfil(pId);
        limparForm();
    });
}

function voltarLista() {
    pessoaAtualId = null;
    document.getElementById('secao-perfil').classList.remove('visivel');
    document.getElementById('secao-lista').classList.add('visivel');
    carregarListaPessoas();
}

function carregarResumoPerfil(pId) {
    db.collection("pessoas").doc(pId).collection("emprestimos").get().then(snapshot => {
        let totalEmp = 0, totalGeral = 0, pago = 0;
        snapshot.forEach(doc => {
            const e = doc.data();
            totalEmp += Number(e.valor || 0);
            totalGeral += Number(e.valorTotal || 0);
            if (e.parcelasDetalhes) {
                e.parcelasDetalhes.forEach(p => { if (p.paga) pago += Number(p.valor || 0); });
            }
        });

        const aReceber = Math.max(0, totalGeral - pago);
        const progresso = totalGeral > 0 ? Math.round((pago / totalGeral) * 100) : 0;

        document.getElementById('total-emprestado').textContent = `R$ ${totalEmp.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-a-receber').textContent = `R$ ${aReceber.toFixed(2).replace('.', ',')}`;
        document.getElementById('valor-pago').textContent = `R$ ${pago.toFixed(2).replace('.', ',')}`;
        document.getElementById('porcentagem-pago').textContent = `${progresso}%`;
        document.getElementById('barra-progresso').style.width = `${progresso}%`;
    });
}

function carregarHistoricoPerfil(pId) {
    const container = document.getElementById('lista-historico');
    if (!container) return;

    db.collection("pessoas").doc(pId).collection("emprestimos").onSnapshot(snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<div class="vazio">📭 Nenhum empréstimo cadastrado nesta pasta.</div>';
            return;
        }

        let lista = [];
        snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => new Date(b.data) - new Date(a.data));

        container.innerHTML = '';
        lista.forEach(e => {
            let pagas = 0;
            if (e.parcelasDetalhes) e.parcelasDetalhes.forEach(p => { if (p.paga) pagas++; });

            let htmlP = '';
            if (e.parcelasDetalhes) {
                e.parcelasDetalhes.forEach(p => {
                    htmlP += `
                        <div class="parcela-chip ${p.paga ? 'paga' : 'pendente'}" onclick="alternarParcela('${e.id}', ${p.numero})">
                            ${p.numero}ª: R$ ${p.valor.toFixed(2).replace('.', ',')}<br>
                            <small>${p.paga ? '✓ Paga' : 'Pendente'}</small>
                        </div>
                    `;
                });
            }

            container.innerHTML += `
                <div class="item-hist">
                    <div class="hist-topo">
                        <span style="font-size: 12px; color: var(--texto-claro);">📅 Data: ${e.data}</span>
                        <button class="btn-opcoes-emp" onclick="abrirDetalhes('${e.id}')">⚙️</button>
                    </div>
                    <div class="hist-valores">
                        <span>Emprestado: R$ ${Number(e.valor).toFixed(2).replace('.', ',')}</span>
                        <span class="hist-total">Total: R$ ${Number(e.valorTotal).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--texto-claro); margin-bottom: 4px;">Parcelas (${pagas}/${e.parcelas} pagas):</div>
                    <div class="parcelas-grid-inline">${htmlP}</div>
                </div>
            `;
        });
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
    const valorParc = valorTotal / parcelas;
    const parcelasDetalhes = [];
    for (let i = 1; i <= parcelas; i++) {
        parcelasDetalhes.push({ numero: i, valor: valorParc, paga: false });
    }

    const editId = document.getElementById('editando-id').value;
    const subColRef = db.collection("pessoas").doc(pessoaAtualId).collection("emprestimos");

    if (editId) {
        subColRef.doc(editId).update({
            valor, juros, parcelas, valorTotal, data, parcelasDetalhes
        }).then(() => {
            limparForm();
            carregarResumoPerfil(pessoaAtualId);
            alert('✅ Atualizado na pasta do cliente!');
        }).catch(err => alert("Erro: " + err.message));
    } else {
        subColRef.add({
            valor, juros, parcelas, valorTotal, data, parcelasDetalhes
        }).then(() => {
            limparForm();
            carregarResumoPerfil(pessoaAtualId);
            alert('✅ Salvo na pasta do cliente!');
        }).catch(err => alert("Erro: " + err.message));
    }
}

function alternarParcela(empId, numParc) {
    const docRef = db.collection("pessoas").doc(pessoaAtualId).collection("emprestimos").doc(empId);
    docRef.get().then(doc => {
        if (!doc.exists) return;
        const emp = doc.data();
        emp.parcelasDetalhes.forEach(p => { if (p.numero === numParc) p.paga = !p.paga; });

        docRef.update({ parcelasDetalhes: emp.parcelasDetalhes }).then(() => {
            carregarResumoPerfil(pessoaAtualId);
            carregarPainelGeral();
        });
    });
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
    if (!pessoaAtualId) return;
    db.collection("pessoas").doc(pessoaAtualId).get().then(doc => {
        if (!doc.exists) return;
        const p = doc.data();
        document.getElementById('modal-titulo').textContent = 'Editar Pessoa';
        document.getElementById('modal-id').value = pessoaAtualId;
        document.getElementById('modal-nome').value = p.nome || '';
        document.getElementById('modal-tel').value = p.telefone || '';
        document.getElementById('modal-obs').value = p.observacoes || '';
        document.getElementById('modal-foto').value = p.foto || '';
        document.getElementById('modal-pessoa').classList.add('aberto');
    });
}

function fecharModal() { document.getElementById('modal-pessoa').classList.remove('aberto'); }

function salvarPessoa() {
    const nome = document.getElementById('modal-nome').value;
    const telefone = document.getElementById('modal-tel').value;
    const observacoes = document.getElementById('modal-obs').value;
    const foto = document.getElementById('modal-foto').value;
    const id = document.getElementById('modal-id').value;

    if (!nome) { alert('Digite o nome!'); return; }

    const dados = { nome, telefone, observacoes, foto };
    if (id) {
        db.collection("pessoas").doc(id).update(dados).then(() => {
            fecharModal(); abrirPerfil(id); alert('✅ Atualizado!');
        }).catch(err => alert("Erro: " + err.message));
    } else {
        db.collection("pessoas").add(dados).then(() => {
            fecharModal(); carregarListaPessoas(); alert('✅ Pasta criada e cliente cadastrado!');
        }).catch(err => alert("Erro: " + err.message));
    }
}

function confirmarExcluirPessoa() {
    if (!pessoaAtualId) return;
    if (confirm('⚠️ Deseja excluir este cliente e todo o histórico da pasta dele?')) {
        // Exclui a pessoa do Firestore
        db.collection("pessoas").doc(pessoaAtualId).delete().then(() => {
            voltarLista();
            alert('✅ Cliente e pasta excluídos!');
        }).catch(err => alert("Erro: " + err.message));
    }
}

function abrirDetalhes(id) {
    empDetalheId = id;
    db.collection("pessoas").doc(pessoaAtualId).collection("emprestimos").doc(id).get().then(doc => {
        if (!doc.exists) return;
        const e = doc.data();
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
    db.collection("pessoas").doc(pessoaAtualId).collection("emprestimos").doc(empDetalheId).get().then(doc => {
        if (!doc.exists) return;
        const e = doc.data();
        fecharDetalhes();

        document.getElementById('editando-id').value = empDetalheId;
        document.getElementById('valor').value = e.valor;
        document.getElementById('juros').value = e.juros;
        document.getElementById('parcelas').value = e.parcelas;
        document.getElementById('data').value = e.data;

        document.getElementById('titulo-form').textContent = '✏️ Editar Empréstimo';
        document.getElementById('btn-salvar').style.display = 'none';
        document.getElementById('btn-atualizar').style.display = 'block';
        document.getElementById('btn-cancelar').style.display = 'block';

        window.scrollTo({ top: 300, behavior: 'smooth' });
    });
}

function excluirSelecionado() {
    if (!empDetalheId) return;
    if (confirm('⚠️ Deseja excluir este empréstimo?')) {
        db.collection("pessoas").doc(pessoaAtualId).collection("emprestimos").doc(empDetalheId).delete().then(() => {
            fecharDetalhes();
            carregarResumoPerfil(pessoaAtualId);
            carregarPainelGeral();
            alert('✅ Empréstimo excluído!');
        }).catch(err => alert("Erro: " + err.message));
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
    document.getElementById('btn-salvar').style.display = 'block';
    document.getElementById('btn-atualizar').style.display = 'none';
    document.getElementById('btn-cancelar').style.display = 'none';
}

// ==========================================
// 7. COMPROMISSOS
// ==========================================
function salvarCompromisso() {
    const titulo = document.getElementById('comp-titulo-input') || document.getElementById('comp-titulo');
    const dataInput = document.getElementById('comp-data');
    
    if (!titulo || !dataInput || !titulo.value || !dataInput.value) {
        alert("Preencha o título e a data do compromisso!");
        return;
    }

    db.collection("compromissos").add({ titulo: titulo.value, data: dataInput.value }).then(() => {
        titulo.value = '';
        dataInput.value = '';
        alert('✅ Lembrete salvo!');
    }).catch(err => alert("Erro: " + err.message));
}

function carregarCompromissos() {
    const container = document.getElementById('lista-compromissos');
    if (!container) return;

    db.collection("compromissos").onSnapshot(snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<div class="vazio">📌 Nenhum compromisso cadastrado.</div>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const c = doc.data();
            container.innerHTML += `
                <div class="item-hist" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <strong>${c.titulo}</strong><br>
                        <small style="color: var(--texto-claro);">📅 ${c.data}</small>
                    </div>
                    <button class="btn-excluir" onclick="excluirCompromisso('${doc.id}')">🗑️</button>
                </div>
            `;
        });
    });
}

function excluirCompromisso(id) {
    if (confirm("Remover este lembrete?")) {
        db.collection("compromissos").doc(id).delete();
    }
}