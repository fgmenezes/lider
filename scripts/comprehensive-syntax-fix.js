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
    
    // Fix 1: Remove linhas órfãs que são propriedades de objeto sem contexto
    const lines = fixedContent.split('\n');
    const filteredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip linhas órfãs que são propriedades de objeto
      if (trimmedLine.match(/^\w+:\s+/) && 
          !trimmedLine.includes('function') && 
          !trimmedLine.includes('async') &&
          !trimmedLine.includes('return') &&
          !trimmedLine.includes('const') &&
          !trimmedLine.includes('let') &&
          !trimmedLine.includes('var') &&
          !trimmedLine.includes('if') &&
          !trimmedLine.includes('for') &&
          !trimmedLine.includes('while')) {
        
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
        
        // Se não há contexto de objeto válido, pula a linha
        if (!prevLine.includes('{') && 
            !prevLine.includes('=') && 
            !prevLine.includes('return') &&
            !prevLine.includes('console.') &&
            !nextLine.includes('}')) {
          continue;
        }
      }
      
      // Skip linhas que são apenas fechamento órfão
      if ((trimmedLine === '} : null);' || trimmedLine === '});') && i > 0) {
        const prevLine = lines[i-1].trim();
        if (!prevLine.includes('{') && !prevLine.includes('return') && !prevLine.includes('=')) {
          continue;
        }
      }
      
      filteredLines.push(line);
    }
    
    let newContent = filteredLines.join('\n');
    
    // Fix 2: Corrigir problemas específicos conhecidos
    
    // Fix para route.ts - remover linhas órfãs de propriedades
    newContent = newContent.replace(/\n\s+userId:\s*{\s*not:\s*userId\s*}\s*\n\s*}\s*\n\s*if\s*\(/g, '\n        });\n\n      if (');
    
    // Fix para members page - problemas de fechamento de objetos
    newContent = newContent.replace(/status:\s*'ATIVO',\s*\n\s*const\s*\[/g, "status: 'ATIVO',\n  });\n  const [");
    newContent = newContent.replace(/status:\s*'ATIVO',\s*\n\s*setFormStep/g, "status: 'ATIVO',\n    });\n    setFormStep");
    
    // Fix para linhas órfãs de status e requiresApproval
    newContent = newContent.replace(/\n\s+\/\/\s*Atualizar\s+o\s+status\s+do\s+membro\s*\n\s+status,\s*\n\s+requiresApproval:\s*requiresApproval\s*\|\|\s*false\s*\n/g, '\n\n        // Atualizar o status do membro\n');
    
    // Remove linhas vazias consecutivas
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Corrigindo erros de sintaxe abrangentemente...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixSyntaxErrors(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Correção concluída!`);
console.log(`📊 ${fixedCount} arquivos foram corrigidos`);