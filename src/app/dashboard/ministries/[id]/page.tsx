'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Save, X, Plus, Trash2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import SelectMasterModal from '@/components/forms/SelectMasterModal'

interface Ministry {
  id: string
  name: string
  description: string
  church: {
    id: string
    name: string
  }
  churchName?: string
  churchPhone?: string
  churchEmail?: string
  pastorName?: string
  pastorPhone?: string
  pastorEmail?: string
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  estado?: string
  status?: string
  leaders: Array<{
    id: string
    userId: string
    ministryId: string
    role: string
    isPrimaryMaster?: boolean
    user: {
      id: string
      name: string
      email: string
      phone?: string
    }
  }>
  members: Array<{
    id: string
    name: string
    email: string
  }>
}

export default function MinistryDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  })
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [addingLeader, setAddingLeader] = useState(false)
  const [showMasterSelection, setShowMasterSelection] = useState(false)
  const [selectedPrimaryMaster, setSelectedPrimaryMaster] = useState('')

  // Verificar permissões
  const hasFullAccess = session?.user?.role === 'ADMIN'
  const canEditData = hasFullAccess

  useEffect(() => {
    if (!id) return

    const fetchMinistry = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/ministries/${id}`)
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do ministério')
        }
        const data = await response.json()
        // Verificando se os dados vêm dentro de um objeto ministry ou diretamente
        const ministryData = data.ministry || data
        setMinistry(ministryData)
        setEditForm({
          name: ministryData.name || '',
          description: ministryData.description || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchMinistry()
  }, [id])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (ministry) {
      setEditForm({
        name: ministry.name || '',
        description: ministry.description || '',
      })
    }
  }

  const handleSave = async () => {
    if (!ministry) return

    try {
      const response = await fetch(`/api/ministries/${ministry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar ministério')
      }

      const updatedMinistry = await response.json()
      setMinistry(updatedMinistry)
      setIsEditing(false)
      toast.success('Ministério atualizado com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar ministério')
    }
  }

  const handleSetPrimaryMaster = async () => {
    if (!ministry || !selectedPrimaryMaster) return

    try {
      const response = await fetch(`/api/ministries/${ministry.id}/primary-master`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderId: selectedPrimaryMaster }),
      })

      if (!response.ok) {
        throw new Error('Falha ao definir líder master principal')
      }

      // Atualizar o estado local
      const updatedMinistry = { ...ministry }
      updatedMinistry.leaders = updatedMinistry.leaders.map(leader => ({
        ...leader,
        isPrimaryMaster: leader.id === selectedPrimaryMaster
      }))
      
      setMinistry(updatedMinistry)
      setShowMasterSelection(false)
      setSelectedPrimaryMaster('')
      toast.success('Líder master principal definido com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao definir líder master principal')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !ministry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-gray-600 mb-4">{error || 'Ministério não encontrado'}</p>
        <Button onClick={() => router.push('/dashboard/ministries')}>
          Voltar para Ministérios
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/ministries')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Detalhes de {ministry.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados">Dados do Ministério</TabsTrigger>
          {hasFullAccess && (
            <TabsTrigger value="master">Líder Master</TabsTrigger>
          )}
          {hasFullAccess && (
            <TabsTrigger value="membros">Membros</TabsTrigger>
          )}
        </TabsList>

        {/* Aba Dados do Ministério */}
        <TabsContent value="dados" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informações Cadastrais</CardTitle>
              {canEditData && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" /> Salvar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seção: Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Ministério</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-medium">{ministry.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <p className="text-lg">
                      <Badge variant={ministry.status === 'ATIVO' ? 'success' : 'secondary'}>
                        {ministry.status || 'ATIVO'}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-700">{ministry.description || 'Sem descrição'}</p>
                  )}
                </div>
              </div>
              
              {/* Seção: Dados da Igreja */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados da Igreja</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Igreja</Label>
                    <p className="text-gray-700">{ministry.churchName || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone da Igreja</Label>
                    <p className="text-gray-700">{ministry.churchPhone || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email da Igreja</Label>
                    <p className="text-gray-700">{ministry.churchEmail || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              
              {/* Seção: Dados do Pastor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Pastor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Pastor</Label>
                    <p className="text-gray-700">{ministry.pastorName || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone do Pastor</Label>
                    <p className="text-gray-700">{ministry.pastorPhone || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email do Pastor</Label>
                    <p className="text-gray-700">{ministry.pastorEmail || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              
              {/* Seção: Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <p className="text-gray-700">{ministry.cep || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rua</Label>
                    <p className="text-gray-700">{ministry.rua || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <p className="text-gray-700">{ministry.numero || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <p className="text-gray-700">{ministry.complemento || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <p className="text-gray-700">{ministry.bairro || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Município</Label>
                    <p className="text-gray-700">{ministry.municipio || 'Não informado'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <p className="text-gray-700">{ministry.estado || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Líder Master */}
        <TabsContent value="master" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Líderes Master</CardTitle>
              <CardDescription>
                Gerencie os líderes master deste ministério
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Lista de Líderes Master */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Líder Master Principal</h3>
                  {hasFullAccess && (
                    <Button 
                      size="sm" 
                      onClick={() => setShowMasterSelection(true)}
                      disabled={!ministry.leaders?.some(leader => leader.role === 'MASTER')}
                    >
                      <Crown className="h-4 w-4 mr-1" /> Definir Líder Principal
                    </Button>
                  )}
                </div>

                {ministry.leaders?.filter(leader => leader.role === 'MASTER').length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      {ministry.leaders
                        .filter(leader => leader.role === 'MASTER')
                        .map(leader => (
                          <div 
                            key={leader.id}
                            className={`border rounded-lg p-4 ${leader.isPrimaryMaster ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">
                                    {leader.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-medium">{leader.user?.name}</h4>
                                  <p className="text-sm text-gray-500">{leader.user?.email}</p>
                                </div>
                              </div>
                              {leader.isPrimaryMaster && (
                                <Badge className="bg-blue-500">Principal</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {showMasterSelection && (
                      <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-3">Selecione o Líder Master Principal</h4>
                        <div className="space-y-3">
                          {ministry.leaders
                            .filter(leader => leader.role === 'MASTER')
                            .map(leader => (
                              <div 
                                key={leader.id}
                                className="flex items-center gap-2"
                              >
                                <input 
                                  type="radio" 
                                  id={`leader-${leader.id}`}
                                  name="primaryMaster"
                                  value={leader.id}
                                  checked={selectedPrimaryMaster === leader.id}
                                  onChange={() => setSelectedPrimaryMaster(leader.id)}
                                  className="h-4 w-4 text-blue-600"
                                />
                                <label htmlFor={`leader-${leader.id}`} className="text-sm">
                                  {leader.user?.name}
                                </label>
                              </div>
                            ))}
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowMasterSelection(false);
                                setSelectedPrimaryMaster('');
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              size="sm"
                              onClick={handleSetPrimaryMaster}
                              disabled={!selectedPrimaryMaster}
                            >
                              Confirmar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">Nenhum líder master cadastrado para este ministério.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Membros */}
        <TabsContent value="membros" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membros do Ministério</CardTitle>
              <CardDescription>
                Gerencie os membros deste ministério
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Seleção de Master */}
      {addingLeader && (
        <SelectMasterModal
          open={addingLeader}
          onClose={() => setAddingLeader(false)}
          onSelect={(user) => {
            // Implementar lógica de adicionar líder
            setAddingLeader(false)
          }}
          ministryId={ministry.id}
        />
      )}
    </div>
  )
}