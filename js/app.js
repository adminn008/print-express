/**
 * GERADOR DE RECIBO DE PRESTAÇÃO DE SERVIÇOS - PRINTEXPRESS
 * Código modular ES6+, leve, responsivo e 100% funcional.
 */

// CONFIGURAÇÃO COMMERCIAL / PREMIUM
const CONFIG = {
    GERADOR_PREMIUM: false, // Altere para 'true' para ativar fluxo pago
    PRECO: "R$ 4,90",
    FORM_ENDPOINT: "COLOQUE_SEU_ENDPOINT_FORMSUBMIT_AQUI", // Ex: https://formsubmit.co/seuemail@dominio.com
    STORAGE_KEY: "printexpress_receipt_draft"
};

// ESTADO GLOBAL DA APLICAÇÃO
let state = {
    currentStep: 1,
    zoomLevel: 100,
    services: [],
    themeColor: '#1e3a8a',
    template: 'classic',
    logoBase64: null,
    mode: 'complete' // 'quick' ou 'complete'
};

// INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', () => {
    initDefaultValues();
    initEventListeners();
    initMasks();
    addServiceItem(); // Adiciona o primeiro item de serviço por padrão
    loadDraft();
    updateReceiptView();
});

// VALORES PADRÃO INICIAIS
function initDefaultValues() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5);

    document.getElementById('issue_date').value = today;
    document.getElementById('issue_time').value = now;
    document.getElementById('receipt_number').value = '001/' + new Date().getFullYear();
    document.getElementById('modal-price-display').innerText = CONFIG.PRECO;
}

// MÁSCARAS AUTOMÁTICAS (CPF, CNPJ, CEP, TELEFONE)
function initMasks() {
    document.addEventListener('input', (e) => {
        const target = e.target;
        
        if (target.classList.contains('mask-cpf')) {
            let v = target.value.replace(/\D/g, '');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            target.value = v;
        }
        
        if (target.classList.contains('mask-cnpj')) {
            let v = target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
            target.value = v;
        }

        if (target.classList.contains('mask-cep')) {
            let v = target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
            target.value = v;
        }

        if (target.classList.contains('mask-phone')) {
            let v = target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{2})(\d)/, '($1) $2');
            v = v.replace(/(\d{5})(\d)/, '$1-$2');
            target.value = v;
        }
    });
}

// CONFIGURAÇÃO DOS EVENT LISTENERS DA INTERFACE
function initEventListeners() {
    // Modo Escuro
    document.getElementById('btn-toggle-dark').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        document.getElementById('btn-toggle-dark').innerHTML = isDark 
            ? '<i class="fa-solid fa-sun"></i> Modo Claro' 
            : '<i class="fa-solid fa-moon"></i> Modo Escuro';
    });

    // Navegação do Stepper
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = parseInt(item.getAttribute('data-step'));
            goToStep(step);
        });
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        if (validateStep(state.currentStep)) {
            goToStep(state.currentStep + 1);
        }
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        goToStep(state.currentStep - 1);
    });

    // Alternância Pessoa Física / Jurídica (Prestador e Cliente)
    document.querySelectorAll('input[name="provider_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('provider', e.target.value));
    });

    document.querySelectorAll('input[name="customer_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('customer', e.target.value));
    });

    // Seleção de Tipo 'Outro'
    document.getElementById('receipt_type').addEventListener('change', (e) => {
        const groupOther = document.getElementById('group_receipt_type_other');
        if (e.target.value === 'Outro') {
            groupOther.classList.remove('hidden');
        } else {
            groupOther.classList.add('hidden');
        }
        renderReceipt();
    });

    // Botão Adicionar Serviço
    document.getElementById('btn-add-service').addEventListener('click', () => {
        addServiceItem();
    });

    // Seleção de Cores Visual
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.themeColor = btn.getAttribute('data-color');
            document.documentElement.style.setProperty('--doc-theme-color', state.themeColor);
            renderReceipt();
        });
    });

    // Seleção de Template Visual
    document.querySelectorAll('input[name="selected_template"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            e.target.closest('.template-card').classList.add('active');
            state.template = e.target.value;
            renderReceipt();
        });
    });

    // Upload e Prévia do Logo
    document.getElementById('logo_input').addEventListener('change', handleLogoUpload);
    document.getElementById('btn-remove-logo').addEventListener('click', removeLogo);

    // Zoom Controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => adjustZoom(10));
    document.getElementById('btn-zoom-out').addEventListener('click', () => adjustZoom(-10));

    // Ações de Saída
    document.getElementById('btn-print').addEventListener('click', handlePrint);
    document.getElementById('btn-pdf').addEventListener('click', handlePDFDownload);
    document.getElementById('btn-share').addEventListener('click', handleShare);

    // Botão Limpar Rascunho
    document.getElementById('btn-clear-form').addEventListener('click', clearDraft);

    // Modos Rápido vs Completo
    document.getElementById('btn-mode-quick').addEventListener('click', () => setMode('quick'));
    document.getElementById('btn-mode-complete').addEventListener('click', () => setMode('complete'));

    // Modal Premium
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('premium-modal').classList.add('hidden');
    });

    // Inputs Monetários e Recálculo Automático
    ['calc_discount', 'calc_addition', 'calc_received'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateTotals);
    });

    // Escutar todos os campos do formulário para auto-save e atualização em tempo real
    document.getElementById('receipt-form').addEventListener('input', () => {
        saveDraft();
        renderReceipt();
    });
}

// NAVEGAÇÃO ENTRE ETAPAS
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 8) return;
    
    state.currentStep = stepNumber;

    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(item => item.classList.remove('active'));

    document.getElementById(`step-${stepNumber}`).classList.add('active');
    document.querySelector(`.step-item[data-step="${stepNumber}"]`).classList.add('active');

    // Scroll suave no mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// VALIDAÇÃO BÁSICA DE ETAPA
function validateStep() {
    return true;
}

// ALTERNÂNCIA PF / PJ
function togglePersonType(target, type) {
    const isPJ = type === 'PJ';
    
    document.getElementById(`group_${target}_name`).classList.toggle('hidden', isPJ);
    document.getElementById(`group_${target}_cpf`).classList.toggle('hidden', isPJ);
    
    document.getElementById(`group_${target}_rs`).classList.toggle('hidden', !isPJ);
    document.getElementById(`group_${target}_cnpj`).classList.toggle('hidden', !isPJ);

    if (document.getElementById(`group_${target}_nf`)) {
        document.getElementById(`group_${target}_nf`).classList.toggle('hidden', !isPJ);
    }
    if (document.getElementById(`group_${target}_im`)) {
        document.getElementById(`group_${target}_im`).classList.toggle('hidden', !isPJ);
        document.getElementById(`group_${target}_ie`).classList.toggle('hidden', !isPJ);
    }

    renderReceipt();
}

// TABELA DINÂMICA DE SERVIÇOS
function addServiceItem(data = null) {
    const id = Date.now();
    const container = document.getElementById('services-container');

    const itemHTML = `
        <div class="service-item-card margin-top-15" id="service-item-${id}" style="border:1px solid var(--border-color); padding:12px; border-radius:6px; background:var(--bg-card);">
            <div class="grid-container">
                <div class="form-group col-6">
                    <label>Descrição do Serviço *</label>
                    <input type="text" class="form-control s-desc" value="${data ? data.desc : ''}" placeholder="Ex: Manutenção de Ar-Condicionado" required>
                </div>
                <div class="form-group col-3">
                    <label>Unidade</label>
                    <select class="form-control s-unit">
                        <option value="unidade">Unidade</option>
                        <option value="hora">Hora</option>
                        <option value="diária">Diária</option>
                        <option value="serviço" selected>Serviço</option>
                        <option value="pacote">Pacote</option>
                        <option value="mês">Mês</option>
                        <option value="projeto">Projeto</option>
                    </select>
                </div>
                <div class="form-group col-3">
                    <label>Qtd. *</label>
                    <input type="number" class="form-control s-qty" value="${data ? data.qty : '1'}" min="1" step="0.01">
                </div>
                <div class="form-group col-4">
                    <label>Valor Unit. (R$) *</label>
                    <input type="number" class="form-control s-price" value="${data ? data.price : '0.00'}" step="0.01">
                </div>
                <div class="form-group col-4">
                    <label>Subtotal (R$)</label>
                    <input type="text" class="form-control s-subtotal readonly" readonly value="0,00">
                </div>
                <div class="form-group col-4" style="display:flex; align-items:flex-end;">
                    <button type="button" class="btn btn-danger-ghost btn-block" onclick="removeServiceItem(${id})">
                        <i class="fa-solid fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHTML);

    // Eventos do novo item
    const card = document.getElementById(`service-item-${id}`);
    card.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            calculateTotals();
            renderReceipt();
        });
    });

    calculateTotals();
    renderReceipt();
}

function removeServiceItem(id) {
    const item = document.getElementById(`service-item-${id}`);
    if (item) {
        item.remove();
        calculateTotals();
        renderReceipt();
    }
}

// CÁLCULOS AUTOMÁTICOS DE SUBTOTAL E TOTAL FINAL
function calculateTotals() {
    let subtotalGeral = 0;

    document.querySelectorAll('.service-item-card').forEach(card => {
        const qty = parseFloat(card.querySelector('.s-qty').value) || 0;
        const price = parseFloat(card.querySelector('.s-price').value) || 0;
        const subtotal = qty * price;

        card.querySelector('.s-subtotal').value = formatCurrency(subtotal);
        subtotalGeral += subtotal;
    });

    const discount = parseFloat(document.getElementById('calc_discount').value) || 0;
    const addition = parseFloat(document.getElementById('calc_addition').value) || 0;
    const total = Math.max(0, subtotalGeral - discount + addition);

    const received = parseFloat(document.getElementById('calc_received').value) || 0;
    const pending = Math.max(0, total - received);

    document.getElementById('calc_subtotal').value = formatCurrency(subtotalGeral);
    document.getElementById('calc_total').value = formatCurrency(total);
    document.getElementById('calc_pending').value = formatCurrency(pending);

    // Atualiza valor por extenso dinamicamente
    document.getElementById('amount_in_words').value = numberToWordsBRL(total);
}

// CONVERSOR DE NÚMEROS PARA VALOR POR EXTENSO (R$)
function numberToWordsBRL(amount) {
    if (amount <= 0 || isNaN(amount)) return "Zero reais";

    const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function getGroup(n) {
        let str = "";
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (n === 100) return "cem";

        if (h > 0) str += hundreds[h];
        if (t === 1) {
            str += (str ? " e " : "") + teens[u];
        } else {
            if (t > 1) str += (str ? " e " : "") + tens[t];
            if (u > 0) str += (str ? " e " : "") + units[u];
        }
        return str;
    }

    const integerPart = Math.floor(amount);
    const cents = Math.round((amount - integerPart) * 100);

    let result = "";

    if (integerPart > 0) {
        if (integerPart < 1000) {
            result += getGroup(integerPart);
        } else if (integerPart < 1000000) {
            const thousands = Math.floor(integerPart / 1000);
            const remainder = integerPart % 1000;
            result += (thousands === 1 ? "mil" : getGroup(thousands) + " mil");
            if (remainder > 0) result += (remainder < 100 || remainder % 100 === 0 ? " e " : " ") + getGroup(remainder);
        }
        result += integerPart === 1 ? " real" : " reais";
    }

    if (cents > 0) {
        if (result) result += " e ";
        result += getGroup(cents) + (cents === 1 ? " centavo" : " centavos");
    }

    return result ? result.charAt(0).toUpperCase() + result.slice(1) : "";
}

// FORMATADOR DE MOEDA (BRL)
function formatCurrency(val) {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// UPLOAD DE LOGO
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            state.logoBase64 = event.target.result;
            renderReceipt();
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    state.logoBase64 = null;
    document.getElementById('logo_input').value = '';
    renderReceipt();
}

// AJUSTE DE ZOOM DA PRÉVIA
function adjustZoom(delta) {
    state.zoomLevel = Math.min(Math.max(50, state.zoomLevel + delta), 150);
    document.getElementById('zoom-level').innerText = `${state.zoomLevel}%`;
    document.getElementById('receipt-document').style.transform = `scale(${state.zoomLevel / 100})`;
}

// MONTAGEM DO TEXTO AUTOMÁTICO DO RECIBO
function generateAutoText() {
    const customerName = document.getElementById('customer_name').value || document.getElementById('customer_rs').value || '[NOME DO CLIENTE]';
    const customerDoc = document.getElementById('customer_cpf').value || document.getElementById('customer_cnpj').value || '[CPF/CNPJ]';
    const totalVal = document.getElementById('calc_total').value;
    const wordsVal = document.getElementById('amount_in_words').value;

    return `Recebi(emos) de ${customerName}, inscrito(a) no CPF/CNPJ nº ${customerDoc}, a importância de R$ ${totalVal} (${wordsVal}), referente à prestação dos serviços detalhados neste documento.`;
}

// RENDERIZAÇÃO DO DOCUMENTO A4 (HTML DINÂMICO)
function renderReceipt() {
    const doc = document.getElementById('receipt-document');
    doc.className = `a4-page template-${state.template}`;

    // Capturar Dados
    const isProviderPJ = document.querySelector('input[name="provider_type"]:checked').value === 'PJ';
    const providerName = isProviderPJ ? document.getElementById('provider_rs').value : document.getElementById('provider_name').value;
    const providerDoc = isProviderPJ ? document.getElementById('provider_cnpj').value : document.getElementById('provider_cpf').value;

    const isCustomerPJ = document.querySelector('input[name="customer_type"]:checked').value === 'PJ';
    const customerName = isCustomerPJ ? document.getElementById('customer_rs').value : document.getElementById('customer_name').value;
    const customerDoc = isCustomerPJ ? document.getElementById('customer_cnpj').value : document.getElementById('customer_cpf').value;

    const receiptNum = document.getElementById('receipt_number').value;
    const issueDate = document.getElementById('issue_date').value;

    // Atualizar texto auto se não tiver sido editado manualmente
    const autoTextElem = document.getElementById('auto_receipt_text');
    if (!autoTextElem.dataset.userEdited) {
        autoTextElem.value = generateAutoText();
    }

    // Coleta dos Serviços
    let servicesRowsHTML = '';
    document.querySelectorAll('.service-item-card').forEach(card => {
        const desc = card.querySelector('.s-desc').value;
        const qty = card.querySelector('.s-qty').value;
        const unit = card.querySelector('.s-unit').value;
        const price = parseFloat(card.querySelector('.s-price').value) || 0;
        const subtotal = card.querySelector('.s-subtotal').value;

        if (desc) {
            servicesRowsHTML += `
                <tr>
                    <td>${desc}</td>
                    <td class="text-center">${qty} ${unit}</td>
                    <td class="text-right">R$ ${formatCurrency(price)}</td>
                    <td class="text-right">R$ ${subtotal}</td>
                </tr>
            `;
        }
    });

    const logoAlign = document.getElementById('logo_align').value;
    const logoSize = document.getElementById('logo_size').value;

    // Template HTML Interno
    doc.innerHTML = `
        <div class="doc-header" style="justify-content:${state.logoBase64 ? 'space-between' : 'flex-end'};">
            ${state.logoBase64 ? `<img src="${state.logoBase64}" class="doc-logo" style="max-height:${logoSize}; align-self:${logoAlign};">` : ''}
            <div class="doc-title-block">
                <div class="doc-title">${document.getElementById('receipt_type').value}</div>
                ${document.getElementById('opt_show_num').checked ? `<div class="doc-number">Nº ${receiptNum}</div>` : ''}
                <div style="font-size:8.5pt; color:#64748b;">Emissão: ${issueDate}</div>
            </div>
        </div>

        <div class="doc-parties">
            <div class="doc-card">
                <div class="doc-card-title">PRESTADOR / RECEBEDOR</div>
                <strong>${providerName || 'Nome do Prestador'}</strong><br>
                ${providerDoc ? `CPF/CNPJ: ${providerDoc}<br>` : ''}
                ${document.getElementById('provider_address').value ? `${document.getElementById('provider_address').value}, ${document.getElementById('provider_number').value}<br>` : ''}
                ${document.getElementById('provider_phone').value ? `Tel/Whats: ${document.getElementById('provider_phone').value}<br>` : ''}
                ${document.getElementById('provider_email').value ? `E-mail: ${document.getElementById('provider_email').value}` : ''}
            </div>

            <div class="doc-card">
                <div class="doc-card-title">CLIENTE / CONTRATANTE</div>
                <strong>${customerName || 'Nome do Cliente'}</strong><br>
                ${customerDoc ? `CPF/CNPJ: ${customerDoc}<br>` : ''}
                ${document.getElementById('customer_address').value ? `Endereço: ${document.getElementById('customer_address').value}<br>` : ''}
                ${document.getElementById('customer_phone').value ? `Contato: ${document.getElementById('customer_phone').value}` : ''}
            </div>
        </div>

        <div class="doc-main-text">
            ${autoTextElem.value}
        </div>

        ${servicesRowsHTML ? `
        <table class="doc-table">
            <thead>
                <tr>
                    <th>Descrição do Serviço</th>
                    <th class="text-center">Qtd / Unid.</th>
                    <th class="text-right">Val. Unit.</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${servicesRowsHTML}
            </tbody>
        </table>
        ` : ''}

        <div class="doc-totals">
            <div class="doc-total-row">
                <span>Subtotal Serviços:</span>
                <span>R$ ${document.getElementById('calc_subtotal').value}</span>
            </div>
            ${parseFloat(document.getElementById('calc_discount').value) > 0 ? `
            <div class="doc-total-row" style="color:var(--danger-color);">
                <span>Desconto:</span>
                <span>- R$ ${formatCurrency(parseFloat(document.getElementById('calc_discount').value))}</span>
            </div>` : ''}
            <div class="doc-total-row final">
                <span>TOTAL RECIBO:</span>
                <span>R$ ${document.getElementById('calc_total').value}</span>
            </div>
        </div>

        <!-- Informações Opcionais de Pagamento / Pix -->
        ${document.getElementById('pix_key').value ? `
        <div class="doc-card margin-top-15">
            <div class="doc-card-title">DADOS PARA PAGAMENTO VIA PIX</div>
            <strong>Chave (${document.getElementById('pix_type').value}):</strong> ${document.getElementById('pix_key').value} | 
            <strong>Recebedor:</strong> ${document.getElementById('pix_receiver').value || providerName}
        </div>
        ` : ''}

        <!-- Termos / Observações -->
        ${document.getElementById('obs_terms').value ? `
        <div style="font-size:8.5pt; margin-top:15px; color:#475569;">
            <strong>Observações / Condições:</strong> ${document.getElementById('obs_terms').value}
        </div>
        ` : ''}

        <!-- Assinaturas -->
        <div class="doc-signatures">
            ${document.getElementById('show_provider_sig').checked ? `
            <div class="sig-box">
                <div class="sig-line"></div>
                <strong>${providerName || 'Prestador'}</strong><br>
                <small>${document.getElementById('sig_provider_role').value || 'Emitente'}</small>
            </div>
            ` : '<div></div>'}

            ${document.getElementById('show_customer_sig').checked ? `
            <div class="sig-box">
                <div class="sig-line"></div>
                <strong>${customerName || 'Cliente'}</strong><br>
                <small>${document.getElementById('sig_customer_role').value || 'Pagador'}</small>
            </div>
            ` : '<div></div>'}
        </div>

        <!-- Rodapé / Aviso Legal -->
        ${document.getElementById('opt_show_nfse_warning').checked ? `
        <div class="doc-footer">
            Este documento é um recibo/comprovação de prestação ou recebimento de serviços e não substitui NFS-e ou outro documento fiscal quando sua emissão for obrigatória.
        </div>
        ` : ''}
    `;
}

// IMPRESSÃO DIRETA A4
function handlePrint() {
    window.print();
}

// GERAÇÃO REAL DE PDF COM HTML2PDF.JS (AJUSTADO PARA A4 COMPLETO)
function handlePDFDownload() {
    if (CONFIG.GERADOR_PREMIUM) {
        document.getElementById('premium-modal').classList.remove('hidden');
        return;
    }

    const element = document.getElementById('receipt-document');
    const receiptNum = document.getElementById('receipt_number').value || '001';
    
    // Reset temporal de escala para renderização perfeita
    const currentTransform = element.style.transform;
    element.style.transform = 'scale(1)';

    const opt = {
        margin: 0,
        filename: `recibo-prestacao-servicos-${receiptNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = currentTransform;
    });
}

// WEB SHARE API
function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Recibo de Prestação de Serviços - PrintExpress',
            text: `Recibo Nº ${document.getElementById('receipt_number').value} gerado pelo PrintExpress.`,
            url: window.location.href
        }).catch(() => {});
    } else {
        alert('A funcionalidade de compartilhamento nativo não é suportada neste navegador.');
    }
}

// MODO RÁPIDO VS COMPLETO
function setMode(mode) {
    state.mode = mode;
    document.getElementById('btn-mode-quick').classList.toggle('active', mode === 'quick');
    document.getElementById('btn-mode-complete').classList.toggle('active', mode === 'complete');
    
    alert(`Modo ${mode === 'quick' ? 'Rápido (campos essenciais)' : 'Completo (todos os campos)'} ativado.`);
}

// PERSISTÊNCIA EM LOCALSTORAGE (RASCUNHO)
function saveDraft() {
    const formData = {
        receipt_number: document.getElementById('receipt_number').value,
        provider_name: document.getElementById('provider_name').value,
        provider_cpf: document.getElementById('provider_cpf').value,
        customer_name: document.getElementById('customer_name').value,
        calc_discount: document.getElementById('calc_discount').value,
        calc_addition: document.getElementById('calc_addition').value
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(formData));
}

function loadDraft() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.receipt_number) document.getElementById('receipt_number').value = data.receipt_number;
            if (data.provider_name) document.getElementById('provider_name').value = data.provider_name;
            if (data.customer_name) document.getElementById('customer_name').value = data.customer_name;
        } catch(e) {}
    }
}

function clearDraft() {
    if (confirm("Tem certeza que deseja apagar este preenchimento?")) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        location.reload();
    }
}
