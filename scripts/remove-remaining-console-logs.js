const fs = require('fs');
const path = require('path');

// Lista de arquivos que ainda contêm console.log statements
const filesToProcess = [
  'src/app/api/small-groups/[id]/members/[memberId]/route.ts',
  'src/app/dashboard/members/[id]/page.tsx',
  'src/app/dashboard/events/page.tsx',
  'src/app/api/small-groups/[id]/leaders/[userId]/route.ts',
  'src/hooks/events/useEvents.ts',
  'src/app/api/members/route.ts',
  'src/app/api/reunioes/[id]/material-apoio/route.ts',
  'src/app/api/users/[id]/avatar/route.ts',
  'src/app/dashboard/members/page.tsx',
  'src/app/api/material-apoio/[id]/route.ts'
];

function removeConsoleLogsFromFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove linhas que contêm console.log, console.warn, console.debug
    // Mas mantém console.error para tratamento de erros
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      
      // Remove console.log, console.warn, console.debug
      if (trimmedLine.includes('console.log(') || 
          trimmedLine.includes('console.warn(') || 
          trimmedLine.includes('console.debug(')) {
        return false;
      }
      
      return true;
    });
    
    const newContent = filteredLines.join('\n');
    
    // Remove linhas vazias consecutivas
    const cleanedContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(fullPath, cleanedContent, 'utf8');
      console.log(`✅ Processado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

console.log('🧹 Removendo console.log statements restantes...\n');

let processedCount = 0;
for (const file of filesToProcess) {
  if (removeConsoleLogsFromFile(file)) {
    processedCount++;
  }
}

console.log(`\n✨ Limpeza concluída!`);
console.log(`📊 ${processedCount} arquivos foram modificados`);