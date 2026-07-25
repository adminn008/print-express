// Variável global para armazenar dados do pedido
let dadosPedido = {
    arquivoNome: "",
    tipoPapelTexto: "",
    precoUnitario: 0,
    quantidade: 1,
    total: 0,
    observacoes: "",
    pagamento: "PIX",
    troco: "",
    cliente: ""
};

// Função para calcular o preço em tempo real no Passo 1
function calcularPreco() {
    const selectPapel = document.getElementById("tipo-papel");
    const optionSelecionada = selectPapel.options[selectPapel.selectedIndex];
    const precoUnitario = parseFloat(optionSelecionada.getAttribute("data-preco"));
    const quantidade = parseInt(document.getElementById("paginas").value) || 1;
    
    const total = precoUnitario * quantidade;
    
    document.getElementById("valor-total").innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Executa o cálculo ao carregar a página
window.onload = function() {
    calcularPreco();
};

// Avançar do Passo 1 para o Passo 2
function irParaPasso2() {
    const arquivoInput = document.getElementById("arquivo");
    if (arquivoInput.files.length === 0) {
        alert("Por favor, selecione um arquivo ou foto para imprimir!");
        return;
    }

    const selectPapel = document.getElementById("tipo-papel");
    const optionSelecionada = selectPapel.options[selectPapel.selectedIndex];
    
    dadosPedido.arquivoNome = arquivoInput.files[0].name;
    dadosPedido.tipoPapelTexto = optionSelecionada.text;
    dadosPedido.precoUnitario = parseFloat(optionSelecionada.getAttribute("data-preco"));
    dadosPedido.quantidade = parseInt(document.getElementById("paginas").value);
    dadosPedido.total = dadosPedido.precoUnitario * dadosPedido.quantidade;
    dadosPedido.observacoes = document.getElementById("observacoes").value || "Nenhuma observação.";

    // Preencher o resumo no passo 2
    document.getElementById("resumo-pedido-texto").innerHTML = `
        📁 <strong>Arquivo:</strong> ${dadosPedido.arquivoNome}<br>
        📄 <strong>Papel:</strong> ${dadosPedido.tipoPapelTexto}<br>
        🔢 <strong>Qtd:</strong> ${dadosPedido.quantidade} unidade(s)<br>
        📝 <strong>Obs:</strong> ${dadosPedido.observacoes}<br>
        💰 <strong>Total a Pagar: R$ ${dadosPedido.total.toFixed(2).replace('.', ',')}</strong>
    `;

    // Trocar de tela
    document.getElementById("step-1").classList.remove("active");
    document.getElementById("step-2").classList.add("active");
}

function voltarParaPasso1() {
    document.getElementById("step-2").classList.remove("active");
    document.getElementById("step-1").classList.add("active");
}

// Controlar exibição do campo de troco se escolher dinheiro
function togglePagamento(tipo) {
    dadosPedido.pagamento = tipo.toUpperCase();
    const campoTroco = document.getElementById("info-troco");
    if (tipo === 'dinheiro') {
        campoTroco.classList.remove('hidden');
    } else {
        campoTroco.classList.add('hidden');
    }
}

// Finalizar o pedido e ir para o Passo 3
function finalizarPedido() {
    const nomeCliente = document.getElementById("nome-cliente").value;
    if (!nomeCliente.trim()) {
        alert("Por favor, informe seu nome ou WhatsApp para identificação.");
        return;
    }

    dadosPedido.cliente = nomeCliente;
    dadosPedido.troco = document.getElementById("troco").value || "Não informado";

    // Aqui você pode integrar com ferramentas como EmailJS ou gerar um link automático para o seu WhatsApp com os dados prontos!
    // Exemplo de instrução dinâmica na tela final:
    let instrucaoPagamento = "";
    if (dadosPedido.pagamento === 'PIX') {
        instrucaoPagamento = `
            <p>Chave PIX (Celular/E-mail): <strong>sua-chave-aqui@email.com</strong></p>
            <p>Valor exato: <strong>R$ ${dadosPedido.total.toFixed(2).replace('.', ',')}</strong></p>
            <small>Envie o comprovante junto com seu nome para o operador.</small>
        `;
    } else {
        instrucaoPagamento = `
            <p>Forma escolhida: <strong>Dinheiro na Retirada</strong></p>
            <p>Troco para: <strong>${dadosPedido.troco}</strong></p>
            <small>Prepare o valor certinho para agilizar!</small>
        `;
    }

    document.getElementById("dados-pagamento-final").innerHTML = instrucaoPagamento;

    // Trocar para a tela final
    document.getElementById("step-2").classList.remove("active");
    document.getElementById("step-3").classList.add("active");
}

function novoPedido() {
    location.reload();
}

