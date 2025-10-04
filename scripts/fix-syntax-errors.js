const fs = require('fs');
const path = require('path');

// Lista de arquivos com erros de sintaxe identificados
const filesToFix = [
  'src/app/api/small-groups/[id]/leaders/[userId]/route.ts',
  'src/app/api/small-groups/[id]/members/[memberId]/route.ts',
  'src/app/dashboard/members/page.tsx'
];

function fixSyntaxErrors(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    let fixedContent = content;
    
    // Padrão para encontrar linhas órfãs que começam com propriedades de objeto
    // Exemplo: "      id: group.id," sem um objeto pai
    const orphanPropertyPattern = /^\s+(\w+):\s+[^,\n]+,?\s*$/gm;
    
    // Remove linhas órfãs que são propriedades de objeto sem contexto
    const lines = fixedContent.split('\n');
    const filteredLines = [];
    let skipNext = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Detecta linhas órfãs que são propriedades de objeto
      if (trimmedLine.match(/^\w+:\s+/) && 
          !trimmedLine.includes('function') && 
          !trimmedLine.includes('async') &&
          !trimmedLine.includes('return') &&
          !trimmedLine.includes('const') &&
          !trimmedLine.includes('let') &&
          !trimmedLine.includes('var')) {
        
        // Verifica se a linha anterior não é parte de um objeto válido
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
        
        if (!prevLine.includes('{') && 
            !prevLine.includes('=') && 
            !prevLine.includes('return') &&
            !nextLine.includes('}')) {
          // Esta é uma linha órfã, pula ela
          continue;
        }
      }
      
      // Remove linhas que são apenas "} : null);" órfãs
      if (trimmedLine === '} : null);' || trimmedLine === '});') {
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        if (!prevLine.includes('{') && !prevLine.includes('return')) {
          continue;
        }
      }
      
      filteredLines.push(line);
    }
    
    const newContent = filteredLines.join('\n');
    
    // Remove linhas vazias consecutivas
    const cleanedContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(fullPath, cleanedContent, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Corrigindo erros de sintaxe...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixSyntaxErrors(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Correção concluída!`);
console.log(`📊 ${fixedCount} arquivos foram corrigidos`);