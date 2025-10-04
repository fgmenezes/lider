'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Search, Filter, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEvent, useEventParticipants, useAddEventParticipant, useRemoveEventParticipant } from '@/hooks/events';
import { ParticipationStatus } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const participationStatusLabels: Record<ParticipationStatus, string> = {
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendente',
  CANCELLED: 'Cancelado'
};

const statusColors: Record<ParticipationStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

export default function EventParticipantsPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipationStatus | 'ALL'>('ALL');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const { data: event } = useEvent(eventId);
  const { data: participants, isLoading } = useEventParticipants(eventId);
  const addParticipantMutation = useAddEventParticipant();
  const removeParticipantMutation = useRemoveEventParticipant();

  const filteredParticipants = participants?.participants?.filter(participant => {
    const name = participant.user?.name || participant.externalName || '';
    const email = participant.user?.email || participant.externalEmail || '';
    
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                         email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || participant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newParticipant.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await addParticipantMutation.mutateAsync({
        eventId,
        externalName: newParticipant.name,
        externalEmail: newParticipant.email || undefined,
        notes: newParticipant.notes || undefined
      });
      
      toast.success('Participante adicionado com sucesso!');
      setShowAddDialog(false);
      setNewParticipant({ name: '', email: '', phone: '', notes: '' });
    } catch (error) {
      toast.error('Erro ao adicionar participante. Tente novamente.');
      console.error('Erro ao adicionar participante:', error);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipantMutation.mutateAsync({ eventId, participantId });
      toast.success('Participante removido com sucesso!');
      setShowRemoveDialog(null);
    } catch (error) {
      toast.error('Erro ao remover participante. Tente novamente.');
      console.error('Erro ao remover participante:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participantes</h1>
            <p className="text-gray-600">{event?.title}</p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Participante
            </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogTitle>Adicionar Participante</DialogTitle>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newParticipant.notes}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addParticipantMutation.isPending}>
                  {addParticipantMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{participants?.participants?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total de Participantes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {participants?.participants?.filter(p => p.status === 'CONFIRMED').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {participants?.participants?.filter(p => p.status === 'PENDING').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {event?.maxParticipants ? `${participants?.participants?.length || 0}/${event.maxParticipants}` : '∞'}
            </div>
            <p className="text-xs text-muted-foreground">Vagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar participantes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ParticipationStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {Object.entries(participationStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Participantes ({filteredParticipants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum participante encontrado</h3>
              <p className="text-gray-600 mb-4">
                {participants?.participants?.length === 0 
                  ? 'Comece adicionando o primeiro participante.' 
                  : 'Tente ajustar os filtros de busca.'}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                Adicionar Primeiro Participante
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{participant.user?.name || participant.externalName}</div>
                        {participant.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {participant.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(participant.user?.email || participant.externalEmail) && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {participant.user?.email || participant.externalEmail}
                          </div>
                        )}
                        {(participant.user?.celular || participant.externalPhone) && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {participant.user?.celular || participant.externalPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[participant.status]}>
                        {participationStatusLabels[participant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(participant.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {participant.status !== 'CONFIRMED' && (
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowRemoveDialog(participant.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!showRemoveDialog} onOpenChange={() => setShowRemoveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Participante</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este participante do evento? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showRemoveDialog && handleRemoveParticipant(showRemoveDialog)}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeParticipantMutation.isPending}
            >
              {removeParticipantMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}