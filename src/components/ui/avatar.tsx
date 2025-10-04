'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AvatarProps {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onAvatarUpdate?: (newAvatarUrl: string | null) => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl'
};

export function Avatar({ 
  userId, 
  userName, 
  avatarUrl, 
  size = 'md', 
  editable = false,
  onAvatarUpdate 
}: AvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerar iniciais do nome
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // Primeira letra do primeiro nome + primeira letra do último nome
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    
    return firstInitial + lastInitial;
  };

  // Gerar cor de fundo baseada no nome
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP');
      return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      setCurrentAvatarUrl(data.avatarUrl);
      onAvatarUpdate?.(data.avatarUrl);
      toast.success('Avatar atualizado com sucesso!');

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    setIsUploading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover avatar');
      }

      setCurrentAvatarUrl(null);
      onAvatarUpdate?.(null);
      toast.success('Avatar removido com sucesso!');

    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const initials = getInitials(userName);
  const bgColor = getBackgroundColor(userName);

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative group`}>
        {currentAvatarUrl ? (
          <Image
            src={currentAvatarUrl}
            alt={`Avatar de ${userName}`}
            fill
            className="object-cover"
            onError={() => {
              setCurrentAvatarUrl(null);
            }}
          />
        ) : (
          <div className={`w-full h-full ${bgColor} flex items-center justify-center text-white font-semibold`}>
            {initials}
          </div>
        )}

        {/* Overlay para modo editável */}
        {editable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Botões de ação para modo editável */}
      {editable && (
        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-lg transition-colors duration-200 disabled:opacity-50"
            title="Alterar avatar"
          >
            <Upload className="w-3 h-3" />
          </button>
          
          {currentAvatarUrl && (
            <button
              onClick={removeAvatar}
              disabled={isUploading}
              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors duration-200 disabled:opacity-50"
              title="Remover avatar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Input de arquivo oculto */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}

export default Avatar;