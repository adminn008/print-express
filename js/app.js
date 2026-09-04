/**
 * GERADOR DE RECIBO DE PRESTAÇÃO DE SERVIÇOS - PRINTEXPRESS
 * Código Otimizado, Responsivo e Sem Cortes em PDF.
 */

const CONFIG = {
    GERADOR_PREMIUM: false,
    PRECO: "R$ 4,90",
    STORAGE_KEY: "printexpress_receipt_draft"
};

let state = {
    currentStep: 1,
    zoomLevel: 100,
    themeColor: '#1e3a8a',
    template: 'classic',
    logoBase64: null,
    mode: 'complete'
};

document.addEventListener('DOMContentLoaded', () => {
    initDefaultValues();
    initEventListeners();
    initMasks();
    addServiceItem();
    initCarousel();
    loadDraft();
    renderReceipt();
});

function initDefaultValues() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const elDate = document.getElementById('issue_date');
    const elTime = document.getElementById('issue_time');
    const elNum = document.getElementById('receipt_number');
    const elPrice = document.getElementById('modal-price-display');

    if (elDate) elDate.value = today;
    if (elTime) elTime.value = now;
    if (elNum && !elNum.value) elNum.value = '001/' + new Date().getFullYear();
    if (elPrice) elPrice.innerText = CONFIG.PRECO;

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

function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    if (!slides.length) return;

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        if (slides[index]) slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        currentSlide = index;
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => showSlide(idx));
    });

    setInterval(() => {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }, 5000);
}

function initMasks() {
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!target) return;

        if (target.classList.contains('mask-cpf')) {
            let v = target.value.replace(/\D/g, '').slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            target.value = v;
        }
        if (target.classList.contains('mask-cnpj')) {
            let v = target.value.replace(/\D/g, '').slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
            target.value = v;
        }
        if (target.classList.contains('mask-cep')) {
            let v = target.value.replace(/\D/g, '').slice(0, 8);
            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
            target.value = v;
        }
        if (target.classList.contains('mask-phone')) {
            let v = target.value.replace(/\D/g, '').slice(0, 11);
            v = v.replace(/^(\d{2})(\d)/, '($1) $2');
            if (v.length > 13) {
                v = v.replace(/(\d{5})(\d{4})$/, '$1-$2');
            } else {
                v = v.replace(/(\d{4})(\d{4})$/, '$1-$2');
            }
            target.value = v;
        }
    });
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function isChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function initEventListeners() {
    const btnDark = document.getElementById('btn-toggle-dark');
    if (btnDark) {
        btnDark.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('printExpress_darkMode', isDark);
            updateDarkModeButton(isDark);
        });
    }

    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = parseInt(item.getAttribute('data-step'));
            goToStep(step);
        });
    });

    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (state.currentStep < 8) goToStep(state.currentStep + 1);
        });
    }

    const btnPrev = document.getElementById('btn-prev');
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (state.currentStep > 1) goToStep(state.currentStep - 1);
        });
    }

    document.querySelectorAll('input[name="provider_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('provider', e.target.value));
    });

    document.querySelectorAll('input[name="customer_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePersonType('customer', e.target.value));
    });

    const receiptType = document.getElementById('receipt_type');
    if (receiptType) {
        receiptType.addEventListener('change', (e) => {
            const groupOther = document.getElementById('group_receipt_type_other');
            if (groupOther) groupOther.classList.toggle('hidden', e.target.value !== 'Outro');
            renderReceipt();
        });
    }

    const btnAddService = document.getElementById('btn-add-service');
    if (btnAddService) btnAddService.addEventListener('click', () => addServiceItem());

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.themeColor = btn.getAttribute('data-color');
            document.documentElement.style.setProperty('--doc-theme-color', state.themeColor);
            renderReceipt();
        });
    });

    document.querySelectorAll('input[name="selected_template"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            const card = e.target.closest('.template-card');
            if (card) card.classList.add('active');
            state.template = e.target.value;
            renderReceipt();
        });
    });

    const logoInput = document.getElementById('logo_input');
    if (logoInput) logoInput.addEventListener('change', handleLogoUpload);

    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    if (btnRemoveLogo) btnRemoveLogo.addEventListener('click', removeLogo);

    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => adjustZoom(10));

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => adjustZoom(-10));

    const btnPrint = document.getElementById('btn-print');
    if (btnPrint) btnPrint.addEventListener('click', handlePrint);

    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) btnPdf.addEventListener('click', handlePDFDownload);

    const btnShare = document.getElementById('btn-share');
    if (btnShare) btnShare.addEventListener('click', handleShare);

    const btnClear = document.getElementById('btn-clear-form');
    if (btnClear) btnClear.addEventListener('click', clearForm);

    ['calc_discount', 'calc_addition', 'calc_received'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateTotals);
    });

    const form = document.getElementById('receipt-form');
    if (form) {
        form.addEventListener('input', () => {
            saveDraft();
            renderReceipt();
        });
    }
}

function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 8) return;
    state.currentStep = stepNumber;

    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(item => item.classList.remove('active'));

    const currentFormStep = document.getElementById(`step-${stepNumber}`);
    if (currentFormStep) currentFormStep.classList.add('active');

    const currentNavStep = document.querySelector(`.step-item[data-step="${stepNumber}"]`);
    if (currentNavStep) currentNavStep.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePersonType(target, type) {
    const isPJ = type === 'PJ';
    const gName = document.getElementById(`group_${target}_name`);
    const gCpf = document.getElementById(`group_${target}_cpf`);
    const gRs = document.getElementById(`group_${target}_rs`);
    const gCnpj = document.getElementById(`group_${target}_cnpj`);
    const gNf = document.getElementById(`group_${target}_nf`);

    if (gName) gName.classList.toggle('hidden', isPJ);
    if (gCpf) gCpf.classList.toggle('hidden', isPJ);
    if (gRs) gRs.classList.toggle('hidden', !isPJ);
    if (gCnpj) gCnpj.classList.toggle('hidden', !isPJ);
    if (gNf) gNf.classList.toggle('hidden', !isPJ);

    renderReceipt();
}

function addServiceItem(data = null) {
    const id = Date.now();
    const container = document.getElementById('services-container');
    if (!container) return;

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

    const card = document.getElementById(`service-item-${id}`);
    if (card) {
        card.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                calculateTotals();
                renderReceipt();
            });
        });
    }

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

function calculateTotals() {
    let subtotalGeral = 0;

    document.querySelectorAll('.service-item-card').forEach(card => {
        const qty = parseFloat(card.querySelector('.s-qty').value) || 0;
        const price = parseFloat(card.querySelector('.s-price').value) || 0;
        const subtotal = qty * price;

        const subtotalInput = card.querySelector('.s-subtotal');
        if (subtotalInput) subtotalInput.value = formatCurrency(subtotal);
        subtotalGeral += subtotal;
    });

    const discount = parseFloat(getValue('calc_discount')) || 0;
    const addition = parseFloat(getValue('calc_addition')) || 0;
    const total = Math.max(0, subtotalGeral - discount + addition);

    const received = parseFloat(getValue('calc_received')) || 0;
    const pending = Math.max(0, total - received);

    const elSub = document.getElementById('calc_subtotal');
    const elTot = document.getElementById('calc_total');
    const elPen = document.getElementById('calc_pending');
    const elWords = document.getElementById('amount_in_words');

    if (elSub) elSub.value = formatCurrency(subtotalGeral);
    if (elTot) elTot.value = formatCurrency(total);
    if (elPen) elPen.value = formatCurrency(pending);
    if (elWords) elWords.value = numberToWordsBRL(total);
}

function numberToWordsBRL(amount) {
    if (amount <= 0 || isNaN(amount)) return "Zero reais";

    const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const tens = ["", "", "vinte", "trinta", "quarenta", "quinquenta", "sessenta", "setenta", "oitenta", "noventa"];
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

function formatCurrency(val) {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
    const input = document.getElementById('logo_input');
    if (input) input.value = '';
    renderReceipt();
}

function adjustZoom(delta) {
    state.zoomLevel = Math.min(Math.max(50, state.zoomLevel + delta), 150);
    const elZoom = document.getElementById('zoom-level');
    const elDoc = document.getElementById('receipt-document');
    if (elZoom) elZoom.innerText = `${state.zoomLevel}%`;
    if (elDoc) elDoc.style.transform = `scale(${state.zoomLevel / 100})`;
}

function generateAutoText() {
    const customerName = getValue('customer_name') || getValue('customer_rs') || '[NOME DO CLIENTE]';
    const customerDoc = getValue('customer_cpf') || getValue('customer_cnpj') || '[CPF/CNPJ]';
    const totalVal = getValue('calc_total') || '0,00';
    const wordsVal = getValue('amount_in_words') || 'zero reais';

    return `Recebi(emos) de ${customerName}, inscrito(a) no CPF/CNPJ nº ${customerDoc}, a importância de R$ ${totalVal} (${wordsVal}), referente à prestação dos serviços detalhados neste documento.`;
}

function renderReceipt() {
    const doc = document.getElementById('receipt-document');
    if (!doc) return;

    doc.className = `a4-page template-${state.template}`;

    const radioProvider = document.querySelector('input[name="provider_type"]:checked');
    const isProviderPJ = radioProvider ? radioProvider.value === 'PJ' : false;
    const providerName = isProviderPJ ? getValue('provider_rs') : getValue('provider_name');
    const providerDoc = isProviderPJ ? getValue('provider_cnpj') : getValue('provider_cpf');

    const radioCustomer = document.querySelector('input[name="customer_type"]:checked');
    const isCustomerPJ = radioCustomer ? radioCustomer.value === 'PJ' : false;
    const customerName = isCustomerPJ ? getValue('customer_rs') : getValue('customer_name');
    const customerDoc = isCustomerPJ ? getValue('customer_cnpj') : getValue('customer_cpf');

    const receiptNum = getValue('receipt_number');
    const issueDate = getValue('issue_date');

    const autoTextElem = document.getElementById('auto_receipt_text');
    if (autoTextElem && !autoTextElem.dataset.userEdited) {
        autoTextElem.value = generateAutoText();
    }

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

    const logoAlign = getValue('logo_align') || 'flex-start';
    const logoSize = getValue('logo_size') || '70px';
    const customMessage = getValue('custom_message');
    const receiptTypeVal = getValue('receipt_type') || 'RECIBO DE PRESTAÇÃO DE SERVIÇOS';

    doc.innerHTML = `
        <div class="doc-header" style="justify-content:${state.logoBase64 ? 'space-between' : 'flex-end'};">
            ${state.logoBase64 ? `<img src="${state.logoBase64}" class="doc-logo" style="max-height:${logoSize}; align-self:${logoAlign};">` : ''}
            <div class="doc-title-block">
                <div class="doc-title">${receiptTypeVal}</div>
                ${isChecked('opt_show_num') ? `<div class="doc-number">Nº ${receiptNum}</div>` : ''}
                <div style="font-size:8.5pt; color:#64748b;">Emissão: ${issueDate}</div>
            </div>
        </div>

        <div class="doc-parties">
            <div class="doc-card">
                <div class="doc-card-title">PRESTADOR / RECEBEDOR</div>
                <strong>${providerName || 'Nome do Prestador'}</strong><br>
                ${providerDoc ? `CPF/CNPJ: ${providerDoc}<br>` : ''}
                ${getValue('provider_address') ? `${getValue('provider_address')}, ${getValue('provider_number')}<br>` : ''}
                ${getValue('provider_phone') ? `Tel/Whats: ${getValue('provider_phone')}<br>` : ''}
                ${getValue('provider_email') ? `E-mail: ${getValue('provider_email')}` : ''}
            </div>

            <div class="doc-card">
                <div class="doc-card-title">CLIENTE / CONTRATANTE</div>
                <strong>${customerName || 'Nome do Cliente'}</strong><br>
                ${customerDoc ? `CPF/CNPJ: ${customerDoc}<br>` : ''}
                ${getValue('customer_address') ? `Endereço: ${getValue('customer_address')}<br>` : ''}
                ${getValue('customer_phone') ? `Contato: ${getValue('customer_phone')}` : ''}
            </div>
        </div>

        <div class="doc-main-text">
            ${autoTextElem ? autoTextElem.value : ''}
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
                <span>R$ ${getValue('calc_subtotal') || '0,00'}</span>
            </div>
            ${parseFloat(getValue('calc_discount')) > 0 ? `
            <div class="doc-total-row" style="color:var(--danger-color);">
                <span>Desconto:</span>
                <span>- R$ ${formatCurrency(parseFloat(getValue('calc_discount')))}</span>
            </div>` : ''}
            <div class="doc-total-row final">
                <span>TOTAL RECIBO:</span>
                <span>R$ ${getValue('calc_total') || '0,00'}</span>
            </div>
        </div>

        ${getValue('pix_key') ? `
        <div class="doc-card margin-top-15">
            <div class="doc-card-title">DADOS PARA PAGAMENTO VIA PIX</div>
            <strong>Chave (${getValue('pix_type')}):</strong> ${getValue('pix_key')} | 
            <strong>Recebedor:</strong> ${getValue('pix_receiver') || providerName}
        </div>
        ` : ''}

        ${getValue('obs_terms') ? `
        <div style="font-size:8.5pt; margin-top:15px; color:#475569;">
            <strong>Observações / Condições:</strong> ${getValue('obs_terms')}
        </div>
        ` : ''}

        ${customMessage ? `
        <div style="font-size:8.5pt; margin-top:10px; color:#1e3a8a; font-style:italic;">
            <strong>Sugestões / Mensagem:</strong> ${customMessage}
        </div>
        ` : ''}

        <div class="doc-signatures">
            ${isChecked('show_provider_sig') ? `
            <div class="sig-box">
                <div class="sig-line"></div>
                <strong>${providerName || 'Prestador'}</strong><br>
                <small>${getValue('sig_provider_role') || 'Emitente'}</small>
            </div>
            ` : '<div></div>'}

            ${isChecked('show_customer_sig') ? `
            <div class="sig-box">
                <div class="sig-line"></div>
                <strong>${customerName || 'Cliente'}</strong><br>
                <small>${getValue('sig_customer_role') || 'Pagador'}</small>
            </div>
            ` : '<div></div>'}
        </div>

        ${isChecked('opt_show_nfse_warning') ? `
        <div class="doc-footer">
            Este documento é um recibo/comprovação de prestação ou recebimento de serviços e não substitui NFS-e ou outro documento fiscal quando sua emissão for obrigatória.
        </div>
        ` : ''}
    `;
}

function handlePrint() {
    window.print();
}

function handlePDFDownload() {
    const element = document.getElementById('receipt-document');
    if (!element) return;

    const receiptNum = getValue('receipt_number') || '001';
    const currentTransform = element.style.transform;
    element.style.transform = 'scale(1)';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `recibo-prestacao-servicos-${receiptNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            element.style.transform = currentTransform;
        });
    } else {
        alert('A biblioteca html2pdf não foi carregada no documento.');
        element.style.transform = currentTransform;
    }
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Recibo de Prestação de Serviços - PrintExpress',
            text: `Recibo Nº ${getValue('receipt_number')} gerado pelo PrintExpress.`,
            url: window.location.href
        }).catch(() => {});
    } else {
        alert('A funcionalidade de compartilhamento não é suportada neste navegador.');
    }
}

function saveDraft() {
    const formData = {
        receipt_number: getValue('receipt_number'),
        provider_name: getValue('provider_name'),
        customer_name: getValue('customer_name')
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(formData));
}

function loadDraft() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.receipt_number && document.getElementById('receipt_number')) document.getElementById('receipt_number').value = data.receipt_number;
            if (data.provider_name && document.getElementById('provider_name')) document.getElementById('provider_name').value = data.provider_name;
            if (data.customer_name && document.getElementById('customer_name')) document.getElementById('customer_name').value = data.customer_name;
        } catch(e) {}
    }
}

function clearForm() {
    if (confirm('Tem certeza de que deseja limpar todos os campos?')) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        const form = document.getElementById('receipt-form');
        if (form) form.reset();
        location.reload();
    }
}
