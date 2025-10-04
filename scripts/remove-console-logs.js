const fs = require('fs');
const path = require('path');

// Função para remover console.log statements de um arquivo
function removeConsoleLogs(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex para encontrar console.log, console.error, console.warn, console.debug
    // Incluindo casos com múltiplas linhas e diferentes formatos
    const consoleRegex = /console\.(log|error|warn|debug|info)\s*\([^;]*\);?/g;
    
    // Remove as linhas que contêm apenas console statements
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      // Remove linhas que são apenas console statements
      return !consoleRegex.test(trimmedLine) || 
             // Mantém console.error em catch blocks para tratamento de erro adequado
             (trimmedLine.includes('console.error') && 
              (trimmedLine.includes('catch') || trimmedLine.includes('Erro')));
    });
    
    const newContent = filteredLines.join('\n');
    
    // Só escreve se houve mudanças
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Removidos console.logs de: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para percorrer diretórios recursivamente
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let processedFiles = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pula node_modules, .git, dist, build
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          if (removeConsoleLogs(fullPath)) {
            processedFiles++;
          }
        }
      }
    }
  }
  
  walkDir(dirPath);
  return processedFiles;
}

// Executa o script
const srcPath = path.join(__dirname, '..', 'src');
console.log('🧹 Iniciando limpeza de console.logs...');
console.log(`📁 Processando diretório: ${srcPath}`);

const processedCount = processDirectory(srcPath);

console.log(`\n✨ Limpeza concluída!`);
console.log(`📊 ${processedCount} arquivos foram modificados`);