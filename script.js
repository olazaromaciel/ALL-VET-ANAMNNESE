// Variáveis globais
let currentSection = 0;
const sections = [
    'responsavel',
    'animal',
    'queixa',
    'historicoAnimal',
    'historicoAmbiental',
    'sinaisClinicos',
    'alimentacao',
    'exameFisico',
    'examesComplementares',
    'condutaTratamento',
    'avaliacao',
    'retorno'
];

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setCurrentDate();
    registerServiceWorker();
    setupScrollSpy();
    
    // Aguardar um pouco para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        setupAIAssistant();
    }, 500);
});

// Registrar Service Worker para PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js?v=20')
                .then(registration => {
                    console.log('SW registrado com sucesso:', registration);
                })
                .catch(registrationError => {
                    console.log('Falha no registro do SW:', registrationError);
                });
        });
    }
}

// Inicializar formulário
function initializeForm() {
    console.log('Inicializando formulário...');
    setupFileUploadPreview();
    setupConditionalReturn();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação lateral
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = button.getAttribute('data-section');
            if (targetSection) {
                scrollToSection(targetSection);
                updateActiveNavButton(button);
            }
        });
    });

    // Botões de ação do rodapé
    setupFooterActions();
    
    // Botões do modal de confirmação
    setupModalButtons();
}

// Scroll para seção específica
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// Atualizar botão de navegação ativo
function updateActiveNavButton(activeButton) {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
}

// Configurar scroll spy
function setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                const navButton = document.querySelector(`[data-section="${sectionId}"]`);
                if (navButton) {
                    updateActiveNavButton(navButton);
                }
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-100px 0px -100px 0px'
    });

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            observer.observe(section);
        }
    });
}

// Configurar ações do rodapé
function setupFooterActions() {
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const footerSaveBtn = document.getElementById('footerSaveBtn');
    const footerPdfBtn = document.getElementById('footerPdfBtn');
    const footerPrintBtn = document.getElementById('footerPrintBtn');
    const footerFinishBtn = document.getElementById('footerFinishBtn');

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
    if (footerSaveBtn) {
        footerSaveBtn.addEventListener('click', saveForm);
    }
    if (footerPdfBtn) {
        footerPdfBtn.addEventListener('click', exportToPDF);
    }
    if (footerPrintBtn) {
        footerPrintBtn.addEventListener('click', printForm);
    }
    if (footerFinishBtn) {
        footerFinishBtn.addEventListener('click', finalizarAtendimento);
    }
}

// Configurar botões do modal de confirmação
function setupModalButtons() {
    const printBtn = document.getElementById('printBtn');
    const exportBtn = document.getElementById('exportBtn');
    const newFormBtn = document.getElementById('newFormBtn');
    const modal = document.getElementById('confirmationModal');

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            printForm();
            if (modal) modal.style.display = 'none';
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToPDF();
            if (modal) modal.style.display = 'none';
        });
    }

    if (newFormBtn) {
        newFormBtn.addEventListener('click', () => {
            resetForm();
            if (modal) modal.style.display = 'none';
        });
    }

    // Fechar modal ao clicar fora dele
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Salvar rascunho
function saveDraft() {
    const formData = collectFormData();
    localStorage.setItem('anamnese_draft', JSON.stringify(formData));
    showToast('Rascunho salvo com sucesso!', 'success');
}

// Salvar formulário
function saveForm() {
    const formData = collectFormData();
    localStorage.setItem('anamnese_final', JSON.stringify(formData));
    showToast('Formulário salvo com sucesso!', 'success');
}

// Exportar para PDF
function exportToPDF() {
    if (window.html2pdf) {
        const element = document.getElementById('anamneseForm');
        const opt = {
            margin: 1,
            filename: `anamnese_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save();
    } else {
        printForm();
    }
}

// Imprimir formulário
function printForm() {
    window.print();
}

// Finalizar atendimento
function finalizarAtendimento() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Coletar dados do formulário
function collectFormData() {
    const formData = {};
    const form = document.getElementById('anamneseForm');
    
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (input.checked) {
                    if (!formData[input.name]) formData[input.name] = [];
                    formData[input.name].push(input.value);
                }
            } else if (input.type === 'radio') {
                if (input.checked) {
                    formData[input.name] = input.value;
                }
            } else {
                formData[input.name] = input.value;
            }
        });
    }
    
    return formData;
}

// Configurar preview de upload de arquivos
function setupFileUploadPreview() {
    const fileInput = document.getElementById('anexosExames');
    const previewDiv = document.getElementById('previewAnexos');
    
    if (fileInput && previewDiv) {
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            previewDiv.innerHTML = '';
            
            Array.from(files).forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file-preview';
                fileDiv.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                    <small>(${(file.size / 1024).toFixed(1)} KB)</small>
                `;
                previewDiv.appendChild(fileDiv);
            });
        });
    }
}

// Configurar retorno condicional
function setupConditionalReturn() {
    const checkbox = document.getElementById('precisaRetorno');
    const camposRetorno = document.getElementById('camposRetorno');
    
    if (checkbox && camposRetorno) {
        checkbox.addEventListener('change', function() {
            camposRetorno.style.display = this.checked ? 'block' : 'none';
        });
    }
}

// Definir data atual
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Mostrar toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Resetar formulário
function resetForm() {
    const form = document.getElementById('anamneseForm');
    if (form) {
        form.reset();
        localStorage.removeItem('anamnese_draft');
        localStorage.removeItem('anamnese_final');
        
        // Scroll para o início
        const firstSection = document.getElementById(sections[0]);
        if (firstSection) {
            firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        showToast('Formulário resetado com sucesso!', 'success');
    }
}

// Verificar se há dados não salvos antes de sair
window.addEventListener('beforeunload', function(e) {
    const formData = collectFormData();
    const hasData = Object.values(formData).some(value => 
        value && value !== '' && value !== '[]' && value !== '{}'
    );
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = 'Você tem dados não salvos. Tem certeza que deseja sair?';
        return e.returnValue;
    }
});

// ==================== FUNCIONALIDADES DE IA ====================

// Configuração do Assistente de IA
function setupAIAssistant() {
    console.log('Configurando assistente de IA...');
    
    // Botão principal de IA
    const analisarBtn = document.getElementById('analisarComIA');

    console.log('Botão principal encontrado:', !!analisarBtn);
    console.log('Elemento do botão:', analisarBtn);

    if (analisarBtn) {
        analisarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Botão Assistência Inteligente clicado');
            analisarComIA();
        });
        console.log('Event listener adicionado com sucesso');
    } else {
        console.error('Botão analisarComIA não encontrado!');
    }
}

// ==================== ANÁLISE INTELIGENTE COM IA ====================

// Função principal: Analisar com IA
async function analisarComIA() {
    console.log('Iniciando análise inteligente com IA...');
    
    // Verificar se há dados suficientes
    const formData = collectFormData();
    const dadosMinimos = verificarDadosMinimos(formData);
    
    if (!dadosMinimos.suficientes) {
        alert(`Para uma análise precisa, preencha pelo menos:\n${dadosMinimos.faltando.join('\n')}`);
        return;
    }

    // Mostrar seção de resultados e loading
    mostrarSecaoResultados();
    showLoading(true);
    
    try {
        // 1. Coletar e processar todos os dados
        const contexto = criarContextoCompleto(formData);
        console.log('Contexto completo criado:', contexto);
        
        // 2. Analisar com IA
        const resultadoIA = await processarAnaliseIA(contexto);
        console.log('Resultado da IA:', resultadoIA);
        
        // 3. Exibir resultados
        exibirResultadosIA(resultadoIA);
        
    } catch (error) {
        console.error('Erro na análise:', error);
        alert('Erro ao analisar com IA. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

// Verificar se há dados mínimos para análise
function verificarDadosMinimos(formData) {
    const faltando = [];
    
    // Pré-requisitos obrigatórios: espécie, queixa principal e exames clínicos
    if (!formData.especie) faltando.push('• Espécie do animal');
    if (!formData.queixaPrincipal) faltando.push('• Motivo da consulta');
    
    // Verificar se há pelo menos alguns dados do exame físico
    const temExameFisico = formData.temperatura || formData.freqCardiaca || formData.freqRespiratoria || formData.tpc || formData.estadoHidratacao || formData.mucosas;
    
    if (!temExameFisico) {
        faltando.push('• Pelo menos alguns dados do exame físico (temperatura, frequências, TPC, etc.)');
    }
    
    return {
        suficientes: faltando.length === 0,
        faltando: faltando
    };
}

// Mostrar seção de resultados
function mostrarSecaoResultados() {
    const resultsSection = document.getElementById('aiResultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Criar contexto completo para análise
function criarContextoCompleto(formData) {
    return {
        animal: {
            nome: formData.nomeAnimal,
            especie: formData.especie,
            raca: formData.raca,
            idade: formData.idade,
            peso: formData.peso,
            sexo: formData.sexo
        },
        queixa: {
            motivo: formData.queixaPrincipal,
            tempoSinais: formData.tempoSinais,
            evolucao: formData.evolucaoQuadro
        },
        sinaisClinicos: {
            sinaisDigestorio: formData.sinaisDigestorio || [],
            sinaisRespiratorio: formData.sinaisRespiratorio || [],
            sinaisUrogenital: formData.sinaisUrogenital || [],
            sinaisNeurologico: formData.sinaisNeurologico || [],
            sinaisMotor: formData.sinaisMotor || [],
            sinaisPele: formData.sinaisPele || []
        },
        exameFisico: {
            temperatura: formData.temperatura,
            frequenciaCardiaca: formData.freqCardiaca,
            frequenciaRespiratoria: formData.freqRespiratoria,
            tpc: formData.tpc,
            hidratacao: formData.estadoHidratacao,
            mucosas: formData.mucosas
        },
        historico: {
            vacinacao: formData.vacinas,
            vermifugacao: formData.ultimaVermifugacao,
            medicamentos: formData.medicamentosAtuais,
            alergias: formData.alergiasConhecidas,
            doencasPrevias: formData.doencasPrevias
        },
        ambiente: {
            tipoVive: formData.tipoMoradia,
            acesso: formData.tipoAcesso,
            contatoAnimais: formData.contatoOutrosAnimais,
            viagens: formData.viagensRecentes
        }
    };
}

// Processar análise com IA
async function processarAnaliseIA(contexto) {
    console.log('Processando análise com IA...');
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const { animal, queixa, sinaisClinicos, exameFisico, historico, ambiente } = contexto;
    
    // Gerar diagnósticos diferenciais
    const diagnosticos = gerarDiagnosticosDiferenciais(contexto);
    
    // Sugerir exames complementares
    const exames = sugerirExamesComplementares(contexto);
    
    // Recomendar condutas iniciais
    const condutas = recomendarCondutasIniciais(contexto);
    
    return {
        diagnosticos,
        exames,
        condutas,
        timestamp: new Date().toISOString()
    };
}

// Gerar diagnósticos diferenciais com probabilidades
function gerarDiagnosticosDiferenciais(contexto) {
    const { animal, queixa, sinaisClinicos, exameFisico } = contexto;
    const diagnosticos = [];
    
    // Análise baseada em sintomas - coletar todos os sintomas marcados
    const todosSintomas = [];
    if (sinaisClinicos.sinaisDigestorio) todosSintomas.push(...sinaisClinicos.sinaisDigestorio);
    if (sinaisClinicos.sinaisRespiratorio) todosSintomas.push(...sinaisClinicos.sinaisRespiratorio);
    if (sinaisClinicos.sinaisUrogenital) todosSintomas.push(...sinaisClinicos.sinaisUrogenital);
    if (sinaisClinicos.sinaisNeurologico) todosSintomas.push(...sinaisClinicos.sinaisNeurologico);
    if (sinaisClinicos.sinaisMotor) todosSintomas.push(...sinaisClinicos.sinaisMotor);
    if (sinaisClinicos.sinaisPele) todosSintomas.push(...sinaisClinicos.sinaisPele);
    
    const sintomasTexto = todosSintomas.join(' ').toLowerCase();
    const queixaTexto = (queixa.motivo || '').toLowerCase();
    
    // Regras para diagnósticos
    if (sintomasTexto.includes('vômito') || sintomasTexto.includes('vomito') || queixaTexto.includes('vômito')) {
        diagnosticos.push({
            nome: 'Gastrite/Gastroenterite',
            probabilidade: 'alta',
            justificativa: 'Sintomas gastrointestinais presentes'
        });
    }
    
    if (sintomasTexto.includes('diarreia') || queixaTexto.includes('diarreia')) {
        diagnosticos.push({
            nome: 'Enterite/Colite',
            probabilidade: 'alta',
            justificativa: 'Alterações intestinais observadas'
        });
    }
    
    if (sintomasTexto.includes('febre') || queixaTexto.includes('febre') || 
        (exameFisico.temperatura && parseFloat(exameFisico.temperatura) > 39.5)) {
        diagnosticos.push({
            nome: 'Processo infeccioso/inflamatório',
            probabilidade: 'alta',
            justificativa: 'Febre ou hipertermia presente'
        });
    }
    
    if (sintomasTexto.includes('tosse') || sintomasTexto.includes('espirro') || 
        sintomasTexto.includes('secreção nasal') || sintomasTexto.includes('secrecao nasal')) {
        diagnosticos.push({
            nome: 'Traqueobronquite infecciosa',
            probabilidade: 'média',
            justificativa: 'Sintomas respiratórios superiores'
        });
    }
    
    if (sintomasTexto.includes('apatia') || sintomasTexto.includes('prostração') || 
        sintomasTexto.includes('prostracao')) {
        diagnosticos.push({
            nome: 'Síndrome sistêmica',
            probabilidade: 'média',
            justificativa: 'Alterações comportamentais indicam comprometimento sistêmico'
        });
    }
    
    if (sintomasTexto.includes('coceira') || sintomasTexto.includes('lesões de pele') || 
        sintomasTexto.includes('lesoes de pele')) {
        diagnosticos.push({
            nome: 'Dermatite alérgica/infecciosa',
            probabilidade: 'média',
            justificativa: 'Sintomas dermatológicos presentes'
        });
    }
    
    // Diagnósticos baseados na espécie
    if (animal.especie === 'Felino' && (sintomasTexto.includes('apatia') || sintomasTexto.includes('anorexia'))) {
        diagnosticos.push({
            nome: 'Síndrome do gato estressado',
            probabilidade: 'baixa',
            justificativa: 'Comportamento típico de estresse felino'
        });
    }
    
    if (animal.especie === 'Canino' && (sintomasTexto.includes('tosse') || sintomasTexto.includes('espirro'))) {
        diagnosticos.push({
            nome: 'Tosse dos canis',
            probabilidade: 'média',
            justificativa: 'Sintomas respiratórios em cão'
        });
    }
    
    // Se não há diagnósticos específicos, adicionar genérico
    if (diagnosticos.length === 0) {
        diagnosticos.push({
            nome: 'Processo patológico não específico',
            probabilidade: 'baixa',
            justificativa: 'Necessário exame físico mais detalhado'
        });
    }
    
    return diagnosticos;
}

// Sugerir exames complementares
function sugerirExamesComplementares(contexto) {
    const { animal, sinaisClinicos, exameFisico } = contexto;
    const exames = [];
    
    // Exames básicos sempre recomendados
    exames.push({
        nome: 'Hemograma completo',
        prioridade: 'alta',
        justificativa: 'Avaliação geral do estado de saúde'
    });
    
    exames.push({
        nome: 'Bioquímica sérica básica',
        prioridade: 'alta',
        justificativa: 'Avaliação de função renal e hepática'
    });
    
    // Exames baseados em sintomas - coletar todos os sintomas marcados
    const todosSintomas = [];
    if (sinaisClinicos.sinaisDigestorio) todosSintomas.push(...sinaisClinicos.sinaisDigestorio);
    if (sinaisClinicos.sinaisRespiratorio) todosSintomas.push(...sinaisClinicos.sinaisRespiratorio);
    if (sinaisClinicos.sinaisUrogenital) todosSintomas.push(...sinaisClinicos.sinaisUrogenital);
    if (sinaisClinicos.sinaisNeurologico) todosSintomas.push(...sinaisClinicos.sinaisNeurologico);
    if (sinaisClinicos.sinaisMotor) todosSintomas.push(...sinaisClinicos.sinaisMotor);
    if (sinaisClinicos.sinaisPele) todosSintomas.push(...sinaisClinicos.sinaisPele);
    
    const sintomasTexto = todosSintomas.join(' ').toLowerCase();
    
    if (sintomasTexto.includes('vômito') || sintomasTexto.includes('vomito') || 
        sintomasTexto.includes('diarreia')) {
        exames.push({
            nome: 'Exame de fezes',
            prioridade: 'alta',
            justificativa: 'Identificar agentes etiológicos gastrointestinais'
        });
    }
    
    if (sintomasTexto.includes('febre') || sintomasTexto.includes('apatia') || 
        sintomasTexto.includes('prostração') || sintomasTexto.includes('prostracao')) {
        exames.push({
            nome: 'Proteína C reativa (PCR)',
            prioridade: 'média',
            justificativa: 'Avaliar processo inflamatório sistêmico'
        });
    }
    
    if (sintomasTexto.includes('tosse') || sintomasTexto.includes('espirro') || 
        sintomasTexto.includes('secreção nasal') || sintomasTexto.includes('secrecao nasal')) {
        exames.push({
            nome: 'Radiografia torácica',
            prioridade: 'média',
            justificativa: 'Avaliar sistema respiratório'
        });
    }
    
    if (sintomasTexto.includes('coceira') || sintomasTexto.includes('lesões de pele') || 
        sintomasTexto.includes('lesoes de pele')) {
        exames.push({
            nome: 'Exame dermatológico (raspado)',
            prioridade: 'média',
            justificativa: 'Identificar agentes dermatológicos'
        });
    }
    
    // Exames baseados no exame físico
    if (exameFisico.temperatura && parseFloat(exameFisico.temperatura) > 39.5) {
        exames.push({
            nome: 'Cultura e antibiograma',
            prioridade: 'média',
            justificativa: 'Febre pode indicar infecção bacteriana'
        });
    }
    
    return exames;
}

// Recomendar condutas iniciais
function recomendarCondutasIniciais(contexto) {
    const { animal, sinaisClinicos, exameFisico, historico } = contexto;
    const condutas = [];
    
    // Condutas gerais
    condutas.push({
        nome: 'Monitoramento de sinais vitais',
        prioridade: 'alta',
        justificativa: 'Acompanhar evolução do quadro clínico'
    });
    
    condutas.push({
        nome: 'Manter animal em ambiente tranquilo',
        prioridade: 'alta',
        justificativa: 'Reduzir estresse e facilitar recuperação'
    });
    
    condutas.push({
        nome: 'Oferecer água fresca ad libitum',
        prioridade: 'alta',
        justificativa: 'Manter hidratação adequada'
    });
    
    // Condutas baseadas em sintomas - coletar todos os sintomas marcados
    const todosSintomas = [];
    if (sinaisClinicos.sinaisDigestorio) todosSintomas.push(...sinaisClinicos.sinaisDigestorio);
    if (sinaisClinicos.sinaisRespiratorio) todosSintomas.push(...sinaisClinicos.sinaisRespiratorio);
    if (sinaisClinicos.sinaisUrogenital) todosSintomas.push(...sinaisClinicos.sinaisUrogenital);
    if (sinaisClinicos.sinaisNeurologico) todosSintomas.push(...sinaisClinicos.sinaisNeurologico);
    if (sinaisClinicos.sinaisMotor) todosSintomas.push(...sinaisClinicos.sinaisMotor);
    if (sinaisClinicos.sinaisPele) todosSintomas.push(...sinaisClinicos.sinaisPele);
    
    const sintomasTexto = todosSintomas.join(' ').toLowerCase();
    
    if (sintomasTexto.includes('vômito') || sintomasTexto.includes('vomito')) {
        condutas.push({
            nome: 'Jejum alimentar de 12-24h',
            prioridade: 'alta',
            justificativa: 'Permitir repouso do trato gastrointestinal'
        });
        
        condutas.push({
            nome: 'Reintrodução gradual de dieta',
            prioridade: 'média',
            justificativa: 'Dieta leve e fracionada após jejum'
        });
    }
    
    if (sintomasTexto.includes('diarreia')) {
        condutas.push({
            nome: 'Dieta gastrointestinal',
            prioridade: 'alta',
            justificativa: 'Alimentação específica para distúrbios intestinais'
        });
    }
    
    if (sintomasTexto.includes('febre') || (exameFisico.temperatura && parseFloat(exameFisico.temperatura) > 39.5)) {
        condutas.push({
            nome: 'Antipirético se temperatura > 40°C',
            prioridade: 'média',
            justificativa: 'Controlar hipertermia excessiva'
        });
    }
    
    if (sintomasTexto.includes('apatia') || sintomasTexto.includes('prostração') || 
        sintomasTexto.includes('prostracao')) {
        condutas.push({
            nome: 'Estimular alimentação',
            prioridade: 'média',
            justificativa: 'Manter estado nutricional adequado'
        });
    }
    
    // Condutas baseadas no histórico
    if (historico.vacinacao === 'atrasada' || historico.vacinacao === 'naoVacinado') {
        condutas.push({
            nome: 'Avaliar necessidade de vacinação',
            prioridade: 'baixa',
            justificativa: 'Prevenção de doenças infecciosas'
        });
    }
    
    if (historico.medicamentos && historico.medicamentos !== 'Nenhum') {
        condutas.push({
            nome: 'Revisar medicamentos em uso',
            prioridade: 'média',
            justificativa: 'Avaliar possíveis interações medicamentosas'
        });
    }
    
    return condutas;
}

// Exibir resultados da IA
function exibirResultadosIA(resultado) {
    console.log('Exibindo resultados da IA...');
    
    // Ocultar loading
    const loadingDiv = document.getElementById('aiLoading');
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    // Mostrar conteúdo dos resultados
    const resultsContent = document.getElementById('aiResultsContent');
    if (resultsContent) {
        resultsContent.style.display = 'block';
        
        // Preencher diagnósticos
        preencherDiagnosticos(resultado.diagnosticos);
        
        // Preencher exames
        preencherExames(resultado.exames);
        
        // Preencher condutas
        preencherCondutas(resultado.condutas);
    }
}

// Preencher lista de diagnósticos
function preencherDiagnosticos(diagnosticos) {
    const container = document.getElementById('diagnosticosList');
    if (!container) return;
    
    container.innerHTML = '';
    
    diagnosticos.forEach(diagnostico => {
        const item = document.createElement('div');
        item.className = 'diagnostico-item';
        item.innerHTML = `
            <span class="probabilidade ${diagnostico.probabilidade}">${diagnostico.probabilidade}</span>
            <div class="diagnostico-texto">
                <strong>${diagnostico.nome}</strong>
                <br><small>${diagnostico.justificativa}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// Preencher lista de exames
function preencherExames(exames) {
    const container = document.getElementById('examesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    exames.forEach(exame => {
        const item = document.createElement('div');
        item.className = 'exame-item';
        item.innerHTML = `
            <i class="fas fa-flask exame-icon"></i>
            <div class="exame-texto">
                <strong>${exame.nome}</strong>
                <br><small>${exame.justificativa}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// Preencher lista de condutas
function preencherCondutas(condutas) {
    const container = document.getElementById('condutasList');
    if (!container) return;
    
    container.innerHTML = '';
    
    condutas.forEach(conduta => {
        const item = document.createElement('div');
        item.className = 'conduta-item';
        item.innerHTML = `
            <i class="fas fa-clipboard-list conduta-icon"></i>
            <div class="conduta-texto">
                <strong>${conduta.nome}</strong>
                <br><small>${conduta.justificativa}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loadingDiv = document.getElementById('aiLoading');
    const resultsContent = document.getElementById('aiResultsContent');
    
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
    
    if (resultsContent && !show) {
        // Não mostrar ainda, será mostrado em exibirResultadosIA
    }
}
