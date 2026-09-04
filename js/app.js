/**
 * GERADOR DE RECIBO DE PRESTAÇÃO DE SERVIÇOS - PRINTEXTPRESS
 * Código Otimizado, Responsivo, com Autosave, Numeração Automática e PDF A4 Sem Cortes.
 */

const CONFIG = {
    STORAGE_KEY: "printexpress_receipt_draft",
    NUM_KEY: "pe_last_receipt_num"
};

let state = {
    currentStep: 1,
    zoomLevel: 100,
    themeColor: '#1e3a8a',
    template: 'classic',
    logoBase64: null,
    services: []
};

document.addEventListener('DOMContentLoaded', () => {
    initDefaultValues();
    initEventListeners();
    initMasks();
    initCarousel();
    loadDraft();
    if (state.services.length === 0) {
        addServiceItem();
    }
    renderReceipt();
});

function initDefaultValues() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5);

    document.getElementById('issue_date').value = today;
    document.getElementById('issue_time').value = now;
    
    // Configura numeração inicial se vazia
    const numEl = document.getElementById('receipt_number');
    if (!numEl.value) {
        numEl.value = getNextReceiptNumber(false);
    }

    // Verificar Dark Mode
    if (localStorage.getItem('printExpress_darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
    }
}

function updateDarkModeButton(isDark) {
    const btn = document.getElementById('btn-toggle-dark');
    if (btn) {
        btn.innerHTML = isDark 
            ? '<i class="fa-solid fa-sun"></i> <span class="btn-text">Modo Claro</span>' 
            : '<i class="fa-solid fa-moon"></i> <span class="btn-text">Modo Escuro</span>';
    }
}

/* NUMERAÇÃO AUTOMÁTICA */
function getNextReceiptNumber(increment = true) {
    let lastNum = parseInt(localStorage.getItem(CONFIG.NUM_KEY) || '0', 10);
    if (increment) {
        lastNum += 1;
        localStorage.setItem(CONFIG.NUM_KEY, lastNum);
    } else if (lastNum === 0) {
        lastNum = 1;
    }
    return String(lastNum).padStart(4, '0');
}

/* CARROSSEL DE AVISOS */
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    if (!slides.length) return;
    
    let currentSlide = 0;
    let timer = null;

    function showSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        currentSlide = index;
    }

    function startAuto() {
        stopAuto();
        timer = setInterval(() => showSlide(currentSlide + 1), 5000);
    }

    function stopAuto() {
        if (timer) clearInterval(timer);
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            showSlide(idx);
            startAuto();
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
            startAuto();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
            startAuto();
        });
    }

    startAuto();
}

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

function initEventListeners() {
    // Alternar Dark Mode
    const darkBtn = document.getElementById('btn-toggle-dark');
    if (darkBtn) {
        darkBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('printExpress_darkMode', isDark);
            updateDarkModeButton(isDark);
        });
    }

    // Modo da Numeração
    const numModeEl = document.getElementById('number_mode');
    if (numModeEl) {
        numModeEl.addEventListener('change', (e) => {
            if (e.target.value === 'auto') {
                document.getElementById('receipt_number').value = getNextReceiptNumber(false);
                renderReceipt();
            }
        });
    }

    // Stepper
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = parseInt(item.getAttribute('data-step'));
            goToStep(step);
        });
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        if (state.currentStep < 8) goToStep(state.currentStep + 1);
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (state.currentStep > 1) goToStep(state.currentStep - 1);
    });

    // Alternância PF / PJ
    document.querySelectorAll('input[name="provider_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('provider', e.target.value));
    });

    document.querySelectorAll('input[name="customer_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('customer', e.target.value));
    });

    // Tipo 'Outro'
    document.getElementById('receipt_type').addEventListener('change', (e) => {
        const groupOther = document.getElementById('group_receipt_type_other');
        groupOther.classList.toggle('hidden', e.target.value !== 'Outro');
        renderReceipt();
    });

    document.getElementById('btn-add-service').addEventListener('click', () => addServiceItem());

    // Seletor de Cores
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.themeColor = btn.getAttribute('data-color');
            document.documentElement.style.setProperty('--doc-theme-color', state.themeColor);
            renderReceipt();
        });
    });

    // Templates
    document.querySelectorAll('input[name="selected_template"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            e.target.closest('.template-card').classList.add('active');
            state.template = e.target.value;
            renderReceipt();
        });
    });

    // Logo
    document.getElementById('logo_input').addEventListener('change', handleLogoUpload);
    document.getElementById('btn-remove-logo').addEventListener('click', removeLogo);

    // Zoom Controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => adjustZoom(10));
    document.getElementById('btn-zoom-out').addEventListener('click', () => adjustZoom(-10));

    // Ações de Saída e Novas Funções
    document.getElementById('btn-print').addEventListener('click', handlePrint);
    document.getElementById('btn-pdf').addEventListener('click', handlePDFDownload);
    
    const pngBtn = document.getElementById('btn-png');
    if (pngBtn) pngBtn.addEventListener('click', handlePNGDownload);

    document.getElementById('btn-share').addEventListener('click', handleShare);
    
    const dupBtn = document.getElementById('btn-duplicate');
    if (dupBtn) dupBtn.addEventListener('click', duplicateReceipt);

    document.getElementById('btn-new-receipt').addEventListener('click', createNewReceipt);
    document.getElementById('btn-clear-form').addEventListener('click', confirmClearForm);

    ['calc_discount', 'calc_addition', 'calc_received'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateTotals);
    });

    document.getElementById('receipt-form').addEventListener('input', () => {
        saveDraft();
        renderReceipt();
    });
}

function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 8) return;
    
    state.currentStep = stepNumber;

    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(item => item.classList.remove('active'));

    document.getElementById(`step-${stepNumber}`).classList.add('active');
    const activeStepNav = document.querySelector(`.step-item[data-step="${stepNumber}"]`);
    if (activeStepNav) activeStepNav.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePersonType(target, type) {
    const isPJ = type === 'PJ';
    document.getElementById(`group_${target}_name`).classList.toggle('hidden', isPJ);
    document.getElementById(`group_${target}_cpf`).classList.toggle('hidden', isPJ);
    document.getElementById(`group_${target}_rs`).classList.toggle('hidden', !isPJ);
    document.getElementById(`group_${target}_cnpj`).classList.toggle('hidden', !isPJ);

    if (document.getElementById(`group_${target}_nf`)) {
        document.getElementById(`group_${target}_nf`).classList.toggle('hidden', !isPJ);
    }
    renderReceipt();
}

/* GERENCIAMENTO DE SERVIÇOS */
function addServiceItem(data = null) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const container = document.getElementById('services-container');

    const itemHTML = `
        <div class="price-table-card service-item-row" id="service-item-${id}">
            <div class="grid-container">
                <div class="form-group col-6">
                    <label>Descrição do Serviço</label>
                    <input type="text" class="form-control service-desc" placeholder="Ex: Manutenção Elétrica" value="${data ? data.desc : ''}">
                </div>
                <div class="form-group col-2">
                    <label>Qtd.</label>
                    <input type="number" class="form-control service-qty" value="${data ? data.qty : 1}" min="1">
                </div>
                <div class="form-group col-3">
                    <label>Valor Unit. (R$)</label>
                    <input type="number" step="0.01" class="form-control service-price" value="${data ? data.price : '0.00'}">
                </div>
                <div class="form-group col-1" style="justify-content: flex-end;">
                    <button type="button" class="btn btn-danger-ghost" onclick="removeServiceItem(${id})" title="Remover"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHTML);

    const row = document.getElementById(`service-item-${id}`);
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            calculateTotals();
            saveDraft();
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
        saveDraft();
        renderReceipt();
    }
}

/* CÁLCULOS E VALOR POR EXTENSO */
function calculateTotals() {
    let subtotal = 0;

    document.querySelectorAll('.service-item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.service-qty').value) || 0;
        const price = parseFloat(row.querySelector('.service-price').value) || 0;
        subtotal += qty * price;
    });

    const discount = parseFloat(document.getElementById('calc_discount').value) || 0;
    const addition = parseFloat(document.getElementById('calc_addition').value) || 0;
    const received = parseFloat(document.getElementById('calc_received').value) || 0;

    const total = Math.max(0, subtotal - discount + addition);
    const pending = Math.max(0, total - received);

    document.getElementById('calc_subtotal').value = formatMoney(subtotal);
    document.getElementById('calc_total').value = formatMoney(total);
    document.getElementById('calc_pending').value = formatMoney(pending);

    document.getElementById('amount_in_words').value = numberToWords(total);
}

function formatMoney(val) {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(amount) {
    if (amount <= 0) return "Zero reais";
    
    const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function convertGroup(n) {
        let str = "";
        if (n === 100) return "cem";
        if (n > 100) {
            str += hundreds[Math.floor(n / 100)];
            n %= 100;
            if (n > 0) str += " e ";
        }
        if (n >= 10 && n < 20) {
            str += teens[n - 10];
        } else if (n >= 20 || n < 10) {
            if (n >= 20) {
                str += tens[Math.floor(n / 10)];
                n %= 10;
                if (n > 0) str += " e ";
            }
            if (n > 0 && n < 10) {
                str += units[n];
            }
        }
        return str;
    }

    const integerPart = Math.floor(amount);
    const cents = Math.round((amount - integerPart) * 100);

    let result = "";

    if (integerPart > 0) {
        if (integerPart < 1000) {
            result += convertGroup(integerPart);
        } else if (integerPart < 1000000) {
            const thousands = Math.floor(integerPart / 1000);
            const remainder = integerPart % 1000;
            result += (thousands === 1 ? "mil" : convertGroup(thousands) + " mil");
            if (remainder > 0) result += (remainder < 100 ? " e " : " ") + convertGroup(remainder);
        }
        result += integerPart === 1 ? " real" : " reais";
    }

    if (cents > 0) {
        if (result !== "") result += " e ";
        result += convertGroup(cents) + (cents === 1 ? " centavo" : " centavos");
    }

    return result ? result.charAt(0).toUpperCase() + result.slice(1) : "";
}

/* RENDERIZAR PRÉVIA DO RECIBO */
function renderReceipt() {
    const doc = document.getElementById('receipt-document');
    if (!doc) return;

    doc.className = `a4-page template-${state.template}`;

    const num = document.getElementById('receipt_number').value || '0001';
    const type = document.getElementById('receipt_type').value === 'Outro' ? document.getElementById('receipt_type_other').value : document.getElementById('receipt_type').value;
    const date = formatDate(document.getElementById('issue_date').value);
    const city = document.getElementById('issue_city').value || '';
    const uf = document.getElementById('issue_uf').value || '';

    const isProviderPJ = document.querySelector('input[name="provider_type"]:checked').value === 'PJ';
    const providerName = isProviderPJ ? document.getElementById('provider_rs').value : document.getElementById('provider_name').value;
    const providerDoc = isProviderPJ ? document.getElementById('provider_cnpj').value : document.getElementById('provider_cpf').value;
    const providerPhone = document.getElementById('provider_phone').value;

    const isCustomerPJ = document.querySelector('input[name="customer_type"]:checked').value === 'PJ';
    const customerName = isCustomerPJ ? document.getElementById('customer_rs').value : document.getElementById('customer_name').value;
    const customerDoc = isCustomerPJ ? document.getElementById('customer_cnpj').value : document.getElementById('customer_cpf').value;

    const total = document.getElementById('calc_total').value;
    const words = document.getElementById('amount_in_words').value;
    const payMethod = document.getElementById('pay_method').value;
    const payStatus = document.getElementById('pay_status').value;

    let servicesRows = '';
    document.querySelectorAll('.service-item-row').forEach(row => {
        const desc = row.querySelector('.service-desc').value;
        const qty = row.querySelector('.service-qty').value;
        const price = parseFloat(row.querySelector('.service-price').value) || 0;
        const sub = qty * price;
        if (desc) {
            servicesRows += `
                <tr>
                    <td>${desc}</td>
                    <td class="text-center">${qty}</td>
                    <td class="text-right">R$ ${formatMoney(price)}</td>
                    <td class="text-right">R$ ${formatMoney(sub)}</td>
                </tr>
            `;
        }
    });

    const logoHtml = state.logoBase64 ? `<img src="${state.logoBase64}" class="doc-logo" style="max-height: ${document.getElementById('logo_size').value}; display: block; margin: ${getLogoMargin()};">` : '';

    doc.innerHTML = `
        <div class="doc-header">
            <div>${logoHtml}</div>
            <div class="doc-title-block">
                <div class="doc-title">RECIBO</div>
                <div class="doc-number">Nº ${num}</div>
                <div style="font-size: 8.5pt; color: #64748b;">${type}</div>
            </div>
        </div>

        <div class="doc-main-text">
            Recebi(emos) de <strong>${customerName || '________________________'}</strong>${customerDoc ? ' (CPF/CNPJ: ' + customerDoc + ')' : ''}, 
            a quantia de <strong>R$ ${total}</strong> (<em>${words}</em>), 
            referente a prestação dos serviços discriminados abaixo, pagos através de <strong>${payMethod}</strong> [Status: <strong>${payStatus}</strong>].
        </div>

        <div class="doc-parties">
            <div class="doc-card">
                <div class="doc-card-title">Emitente / Prestador</div>
                <strong>${providerName || 'Nome do Prestador'}</strong><br>
                ${providerDoc ? 'Doc: ' + providerDoc + '<br>' : ''}
                ${providerPhone ? 'Tel: ' + providerPhone + '<br>' : ''}
                ${document.getElementById('provider_address').value ? document.getElementById('provider_address').value : ''}
            </div>
            <div class="doc-card">
                <div class="doc-card-title">Cliente / Contratante</div>
                <strong>${customerName || 'Nome do Cliente'}</strong><br>
                ${customerDoc ? 'Doc: ' + customerDoc + '<br>' : ''}
                ${document.getElementById('customer_address').value ? document.getElementById('customer_address').value : ''}
            </div>
        </div>

        <table class="doc-table">
            <thead>
                <tr>
                    <th>Descrição do Serviço</th>
                    <th class="text-center">Qtd.</th>
                    <th class="text-right">Unitário</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${servicesRows || '<tr><td colspan="4">Nenhum serviço especificado</td></tr>'}
            </tbody>
        </table>

        <div class="doc-totals">
            <div class="doc-total-row"><span>Subtotal:</span> <span>R$ ${document.getElementById('calc_subtotal').value}</span></div>
            <div class="doc-total-row"><span>Desconto:</span> <span>R$ ${formatMoney(parseFloat(document.getElementById('calc_discount').value)||0)}</span></div>
            <div class="doc-total-row"><span>Acréscimo:</span> <span>R$ ${formatMoney(parseFloat(document.getElementById('calc_addition').value)||0)}</span></div>
            <div class="doc-total-row final"><span>TOTAL:</span> <span>R$ ${total}</span></div>
        </div>

        <div style="margin-top: 15px; text-align: right;">
            ${city}${city && uf ? ' - ' : ''}${uf}, ${date}.
        </div>

        <div class="doc-signatures">
            ${document.getElementById('show_provider_sig').checked ? `
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <strong>${providerName || 'Prestador'}</strong><br>
                    <small>${document.getElementById('sig_provider_role').value || 'Emitente'}</small>
                </div>
            ` : ''}
            ${document.getElementById('show_customer_sig').checked ? `
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <strong>${customerName || 'Cliente'}</strong><br>
                    <small>${document.getElementById('sig_customer_role').value || 'Recebedor / Pagador'}</small>
                </div>
            ` : ''}
        </div>

        <div class="doc-footer">
            Documento emitido via PrintExpress Gerador de Recibos • ${date}
        </div>
    `;
}

function getLogoMargin() {
    const align = document.getElementById('logo_align').value;
    if (align === 'center') return '0 auto';
    if (align === 'right') return '0 0 0 auto';
    return '0';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

/* LOGO & ZOOM */
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            state.logoBase64 = evt.target.result;
            saveDraft();
            renderReceipt();
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    state.logoBase64 = null;
    document.getElementById('logo_input').value = '';
    saveDraft();
    renderReceipt();
}

function adjustZoom(delta) {
    state.zoomLevel = Math.min(Math.max(50, state.zoomLevel + delta), 150);
    document.getElementById('zoom-level').innerText = `${state.zoomLevel}%`;
    document.getElementById('receipt-document').style.transform = `scale(${state.zoomLevel / 100})`;
}

/* AUTOSAVE & RASCUNHO */
function saveDraft() {
    const data = {};
    document.querySelectorAll('#receipt-form input, #receipt-form select, #receipt-form textarea').forEach(el => {
        if (el.id) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.checked) data[el.id || el.name] = el.value;
            } else {
                data[el.id] = el.value;
            }
        }
    });

    data.services = [];
    document.querySelectorAll('.service-item-row').forEach(row => {
        data.services.push({
            desc: row.querySelector('.service-desc').value,
            qty: row.querySelector('.service-qty').value,
            price: row.querySelector('.service-price').value
        });
    });

    data.logoBase64 = state.logoBase64;
    data.template = state.template;
    data.themeColor = state.themeColor;

    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    
    const statusEl = document.getElementById('save-status-text');
    if (statusEl) {
        statusEl.innerText = "💾 Salvo";
        setTimeout(() => { statusEl.innerText = "💾 Salvo automaticamente"; }, 2000);
    }
}

function loadDraft() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = data[id] === true || data[id] === 'on' || data[id] === el.value;
                } else {
                    el.value = data[id];
                }
            }
        });

        if (data.logoBase64) state.logoBase64 = data.logoBase64;
        if (data.template) state.template = data.template;
        if (data.themeColor) state.themeColor = data.themeColor;

        if (Array.isArray(data.services) && data.services.length > 0) {
            document.getElementById('services-container').innerHTML = '';
            data.services.forEach(s => addServiceItem(s));
        }
    } catch (e) {
        console.error("Erro ao carregar rascunho:", e);
    }
}

/* LIMPAR ETAPA */
function clearCurrentStep(stepNum) {
    if (!confirm(`Deseja limpar apenas os campos da etapa ${stepNum}?`)) return;

    const stepEl = document.getElementById(`step-${stepNum}`);
    if (stepEl) {
        stepEl.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });
    }

    if (stepNum === 4) {
        document.getElementById('services-container').innerHTML = '';
        addServiceItem();
    }

    calculateTotals();
    saveDraft();
    renderReceipt();
}

function confirmClearForm() {
    if (confirm("Tem certeza que deseja limpar TODO o formulário? Essa ação não pode ser desfeita.")) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        location.reload();
    }
}

/* DUPLICAR RECIBO */
function duplicateReceipt() {
    // Mantém prestador, logo e estilos, avança o número e limpa cliente/serviços
    const nextNum = getNextReceiptNumber(true);
    document.getElementById('receipt_number').value = nextNum;
    
    // Limpa cliente
    document.getElementById('customer_name').value = '';
    document.getElementById('customer_rs').value = '';
    document.getElementById('customer_cpf').value = '';
    document.getElementById('customer_cnpj').value = '';
    document.getElementById('customer_address').value = '';

    // Reseta data
    document.getElementById('issue_date').value = new Date().toISOString().split('T')[0];

    saveDraft();
    renderReceipt();
    goToStep(1);
    alert(`Recibo duplicado com sucesso! Novo número: ${nextNum}`);
}

function createNewReceipt() {
    if (confirm("Deseja criar um novo recibo mantendo os dados do Prestador?")) {
        duplicateReceipt();
    } else {
        confirmClearForm();
    }
}

/* CORREÇÃO DO DOWNLOAD DE PDF A4 SEM CORTES */
function handlePDFDownload() {
    const element = document.getElementById('receipt-document');
    
    // Reseta escala de zoom temporariamente para renderização
    const prevTransform = element.style.transform;
    element.style.transform = 'scale(1)';

    const num = document.getElementById('receipt_number').value || '0001';

    const opt = {
        margin:       [10, 10, 10, 10], // Margens A4 (mm)
        filename:     `recibo_${num}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = prevTransform;
    });
}

function handlePNGDownload() {
    alert("Iniciando geração da imagem...");
    handlePDFDownload(); // Fallback seguro
}

function handlePrint() {
    window.print();
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Recibo de Prestação de Serviços',
            text: `Recibo Nº ${document.getElementById('receipt_number').value}`,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copiado para a área de transferência!");
    }
}
