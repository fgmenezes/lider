export async function fetchAddressByCep(cep: string) {
  // Limpa o CEP, removendo caracteres não numéricos
  const cleanCep = cep.replace(/\D/g, '');

  // Verifica se o CEP tem 8 dígitos
  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
  }

  try {
    // Consulta a API da ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      // Se a resposta não for bem-sucedida (ex: 404), lança um erro
      throw new Error(`Erro ao buscar CEP: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // A ViaCEP retorna um objeto com erro=true se o CEP não for encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado.');
    }

    // Retorna os dados do endereço
    return data;

  } catch (error) {
    console.error('Erro na função fetchAddressByCep:', error);
    // Relança o erro para ser tratado por quem chamou a função
    throw error;
  }
}

// Exemplo de uso (apenas para demonstração, pode ser removido depois)
/*
fetchAddressByCep('01001000')
  .then(address => {
  })
  .catch(error => {
  });
*/ 