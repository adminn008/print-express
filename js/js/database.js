const DB = {
    categories: [
        { id: 'all', name: 'Todos' },
        { id: 'recibos', name: '🧾 Recibos' },
        { id: 'declaracoes', name: '📑 Declarações' },
        { id: 'contratos', name: '📋 Contratos e Autorizações' },
        { id: 'trabalho', name: '💼 Trabalho e Renda' },
        { id: 'imoveis', name: '🏠 Imóveis' },
        { id: 'financeiro', name: '💰 Financeiro' }
    ],
    generators: [
        {
            id: 'recibo-servico',
            title: 'Recibo de Serviço',
            description: 'Comprovante de pagamento por prestação de serviços profissionais.',
            categories: ['recibos', 'financeiro'],
            tags: ['serviço', 'pagamento', 'autônomo'],
            isPremium: false,
            fields: [
                { id: 'emissor', label: 'Nome do Prestador (Quem recebeu)', type: 'text', step: 1, required: true },
                { id: 'doc_emissor', label: 'CPF/CNPJ do Prestador', type: 'text', step: 1, required: true },
                { id: 'pagador', label: 'Nome do Cliente (Quem pagou)', type: 'text', step: 2, required: true },
                { id: 'doc_pagador', label: 'CPF/CNPJ do Cliente', type: 'text', step: 2, required: true },
                { id: 'valor', label: 'Valor (R$)', type: 'number', step: 3, required: true },
                { id: 'servico', label: 'Descrição do Serviço', type: 'textarea', step: 3, required: true },
                { id: 'data', label: 'Data do Pagamento', type: 'date', step: 3, required: true }
            ]
        },
        {
            id: 'recibo-aluguel',
            title: 'Recibo de Aluguel',
            description: 'Comprovante de pagamento de locação residencial ou comercial.',
            categories: ['recibos', 'imoveis', 'financeiro'],
            tags: ['aluguel', 'locacao', 'imovel'],
            isPremium: false,
            fields: [
                { id: 'locador', label: 'Nome do Locador (Proprietário)', type: 'text', step: 1, required: true },
                { id: 'locatario', label: 'Nome do Locatário (Inquilino)', type: 'text', step: 2, required: true },
                { id: 'valor', label: 'Valor do Aluguel (R$)', type: 'number', step: 3, required: true },
                { id: 'referencia', label: 'Mês de Referência (ex: Janeiro/2026)', type: 'text', step: 3, required: true },
                { id: 'data', label: 'Data do Pagamento', type: 'date', step: 3, required: true }
            ]
        },
        {
            id: 'declaracao-residencia',
            title: 'Declaração de Residência',
            description: 'Atesta o endereço de moradia para pessoas sem comprovante próprio.',
            categories: ['declaracoes', 'imoveis'],
            tags: ['moradia', 'endereco', 'comprovante'],
            isPremium: false,
            fields: [
                { id: 'nome', label: 'Seu Nome Completo', type: 'text', step: 1, required: true },
                { id: 'cpf', label: 'Seu CPF', type: 'text', step: 1, required: true },
                { id: 'rg', label: 'Seu RG', type: 'text', step: 1, required: true },
                { id: 'endereco', label: 'Endereço Completo de Residência', type: 'text', step: 2, required: true },
                { id: 'cidade_uf', label: 'Cidade / UF', type: 'text', step: 2, required: true },
                { id: 'data', label: 'Data', type: 'date', step: 3, required: true }
            ]
        },
        {
            id: 'declaracao-hipossuficiencia',
            title: 'Declaração de Hipossuficiência',
            description: 'Declaração para pedido de justiça gratuita ou isenção de taxas.',
            categories: ['declaracoes'],
            tags: ['justica', 'pobreza', 'isencao', 'taxa'],
            isPremium: false,
            fields: [
                { id: 'nome', label: 'Nome Completo', type: 'text', step: 1, required: true },
                { id: 'cpf', label: 'CPF', type: 'text', step: 1, required: true },
                { id: 'rg', label: 'RG', type: 'text', step: 1, required: true },
                { id: 'profissao', label: 'Profissão', type: 'text', step: 2, required: true },
                { id: 'cidade_uf', label: 'Cidade / UF', type: 'text', step: 2, required: true },
                { id: 'data', label: 'Data', type: 'date', step: 3, required: true }
            ]
        },
        {
            id: 'contrato-namoro',
            title: 'Contrato de Namoro',
            description: 'Define expressamente que o relacionamento não configura união estável.',
            categories: ['contratos'],
            tags: ['namoro', 'relacionamento', 'uniao'],
            isPremium: false,
            fields: [
                { id: 'p1_nome', label: 'Nome do Primeiro(a) Namorado(a)', type: 'text', step: 1, required: true },
                { id: 'p1_cpf', label: 'CPF da 1ª Parte', type: 'text', step: 1, required: true },
                { id: 'p2_nome', label: 'Nome do Segundo(a) Namorado(a)', type: 'text', step: 2, required: true },
                { id: 'p2_cpf', label: 'CPF da 2ª Parte', type: 'text', step: 2, required: true },
                { id: 'data_inicio', label: 'Data aproximada do início do namoro', type: 'date', step: 3, required: true },
                { id: 'cidade_uf', label: 'Cidade / UF', type: 'text', step: 3, required: true }
            ]
        }
        // Demais geradores mapeados internamente seguem esta mesma estrutura modular
    ]
};
