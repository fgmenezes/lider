import { Client } from "minio";

// Cria o cliente MinIO usando variáveis de ambiente
// Configuração para s3.fegsoft.com.br (compatível com S3)
const endpoint = process.env.MINIO_ENDPOINT || 's3.fegsoft.com.br';
const port = 443; // HTTPS padrão para S3
const useSSL = true; // Sempre usar SSL para S3

const minioClient = new Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

console.log('MinIO configurado:', { endPoint: endpoint, port, useSSL });

/**
 * Upload de um arquivo para o bucket
 */
export async function uploadFile(fileName, fileBuffer, contentType = "application/octet-stream") {
  try {
    await minioClient.putObject(process.env.MINIO_BUCKET, fileName, fileBuffer, { contentType });
    console.log(`Arquivo "${fileName}" enviado com sucesso!`);
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    throw error;
  }
}

/**
 * Faz upload de material de apoio com estrutura organizada por data/hora
 */
export async function uploadMaterialApoio(fileName, fileBuffer, contentType, ministerioId, smallGroupId, meetingId) {
  try {
    // Gerar estrutura de pastas por data/hora
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    // Construir caminho completo
    const filePath = `ministries/${ministerioId}/small-groups/${smallGroupId}/meetings/${meetingId}/materiais-apoio/${year}/${month}/${day}/${hour}/${minute}/${fileName}`;
    
    // Fazer upload
    await minioClient.putObject('sistemalider', filePath, fileBuffer, fileBuffer.length, { 'Content-Type': contentType });
    console.log(`Upload de material de apoio realizado com sucesso: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error("Erro no upload de material de apoio:", error);
    throw error;
  }
}

/**
 * Download de um arquivo do bucket
 * Retorna o buffer do arquivo
 */
export async function downloadFile(fileName) {
  return new Promise((resolve, reject) => {
    minioClient.getObject(process.env.MINIO_BUCKET, fileName, (err, dataStream) => {
      if (err) return reject(err);

      const chunks = [];
      dataStream.on("data", chunk => chunks.push(chunk));
      dataStream.on("end", () => resolve(Buffer.concat(chunks)));
      dataStream.on("error", err => reject(err));
    });
  });
}

/**
 * Lista arquivos do bucket
 * @param {string} prefix - filtra arquivos por prefixo (simula pastas)
 */
export async function listFiles(prefix = "") {
  return new Promise((resolve, reject) => {
    const files = [];
    const stream = minioClient.listObjects(process.env.MINIO_BUCKET, prefix, true);

    stream.on("data", obj => files.push(obj.name));
    stream.on("error", err => reject(err));
    stream.on("end", () => resolve(files));
  });
}

/**
 * Gera URL temporária (presigned) para download de um arquivo
 */
export async function getPresignedUrl(fileName, expires = 60) {
  return new Promise((resolve, reject) => {
    minioClient.presignedGetObject(process.env.MINIO_BUCKET, fileName, expires, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

/**
 * Cria uma “pasta” no bucket (na prática, cria um objeto vazio com nome terminado em '/')
 */
export async function createFolder(folderName) {
  if (!folderName.endsWith("/")) folderName += "/";
  await minioClient.putObject(process.env.MINIO_BUCKET, folderName, "");
  console.log(`Pasta "${folderName}" criada com sucesso!`);
}

/**
 * Remove um arquivo ou pasta (para pasta, remove todos os objetos com prefixo)
 */
export async function removeObject(objectName) {
  if (objectName.endsWith("/")) {
    // Remove todos os objetos dentro da "pasta"
    const objects = await listFiles(objectName);
    if (objects.length > 0) {
      await minioClient.removeObjects(process.env.MINIO_BUCKET, objects);
    }
    console.log(`Pasta "${objectName}" removida com sucesso!`);
  } else {
    await minioClient.removeObject(process.env.MINIO_BUCKET, objectName);
    console.log(`Arquivo "${objectName}" removido com sucesso!`);
  }
}

/**
 * Cria um bucket se não existir
 */
export async function createBucketIfNotExists(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket "${bucketName}" criado com sucesso!`);
      
      // Definir política de bucket privado
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }]
      };
      
      try {
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`Política privada aplicada ao bucket "${bucketName}"`);
      } catch (policyError) {
        console.warn(`Aviso: Não foi possível aplicar política ao bucket "${bucketName}":`, policyError.message);
      }
    } else {
      console.log(`Bucket "${bucketName}" já existe.`);
    }
  } catch (error) {
    console.error(`Erro ao criar bucket "${bucketName}":`, error);
    throw error;
  }
}

/**
 * Remove um bucket e todos os seus objetos
 */
export async function removeBucket(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (exists) {
      // Listar e remover todos os objetos primeiro
      const objectsList = [];
      const objectsStream = minioClient.listObjects(bucketName, '', true);
      
      for await (const obj of objectsStream) {
        objectsList.push(obj.name);
      }
      
      if (objectsList.length > 0) {
        await minioClient.removeObjects(bucketName, objectsList);
        console.log(`${objectsList.length} objetos removidos do bucket "${bucketName}"`);
      }
      
      // Remover o bucket
      await minioClient.removeBucket(bucketName);
      console.log(`Bucket "${bucketName}" removido com sucesso!`);
    } else {
      console.log(`Bucket "${bucketName}" não existe.`);
    }
  } catch (error) {
    console.error(`Erro ao remover bucket "${bucketName}":`, error);
    throw error;
  }
}

/**
 * Inicializa os buckets do sistema
 */
export async function initializeBuckets() {
  try {
    console.log('Inicializando buckets do sistema...');
    
    // Criar bucket sistemalider
    await createBucketIfNotExists('sistemalider');
    
    // Tentar remover bucket antigo materialapoio (apenas se estiver vazio)
    try {
      const exists = await minioClient.bucketExists('materialapoio');
      if (exists) {
        console.log('Bucket materialapoio existe. Verificando se está vazio...');
        const objectsList = [];
        const objectsStream = minioClient.listObjects('materialapoio', '', true);
        
        for await (const obj of objectsStream) {
          objectsList.push(obj.name);
          if (objectsList.length > 0) break; // Parar na primeira ocorrência
        }
        
        if (objectsList.length === 0) {
          await minioClient.removeBucket('materialapoio');
          console.log('Bucket materialapoio removido (estava vazio)');
        } else {
          console.log(`Bucket materialapoio contém ${objectsList.length} arquivos. Mantendo para compatibilidade.`);
        }
      }
    } catch (bucketError) {
      console.warn('Aviso ao processar bucket materialapoio:', bucketError.message);
    }
    
    console.log('Inicialização de buckets concluída!');
  } catch (error) {
    console.error('Erro na inicialização de buckets:', error);
    throw error;
  }
}

export default minioClient;
