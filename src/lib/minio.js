import { Client } from "minio";

// Cria o cliente MinIO usando variáveis de ambiente
// Configuração dinâmica baseada no endpoint
const endpoint = process.env.MINIO_ENDPOINT?.replace('https://', '').replace('http://', '') || 'localhost';
const port = process.env.MINIO_ENDPOINT?.includes('https://') ? 443 : 9000;
const useSSL = process.env.MINIO_ENDPOINT?.includes('https://') || false;

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

export default minioClient;
