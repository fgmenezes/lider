const http = require('http');

function testAPIEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/dashboard/activities',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Test-Script/1.0'
    }
  };

  console.log('🧪 Testando endpoint da API de atividades...');
  console.log(`📡 URL: http://${options.hostname}:${options.port}${options.path}`);

  const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n📄 Resposta da API:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (jsonData.activities && jsonData.activities.length > 0) {
          console.log(`\n✅ Sucesso! ${jsonData.activities.length} atividades encontradas.`);
        } else if (jsonData.error) {
          console.log(`\n❌ Erro na API: ${jsonData.error}`);
        } else {
          console.log('\n⚠️ Nenhuma atividade encontrada.');
        }
      } catch (error) {
        console.log('❌ Erro ao parsear JSON:', error.message);
        console.log('📄 Resposta bruta:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Verifique se o servidor está rodando na porta 3001');
    }
  });

  req.setTimeout(10000, () => {
    console.log('⏰ Timeout da requisição (10s)');
    req.destroy();
  });

  req.end();
}

testAPIEndpoint();