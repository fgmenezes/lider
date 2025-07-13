"use client";
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { Menu } from '@headlessui/react';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';

export default function LeaderDetailsPage() {
  const params = useParams();
  const id = params.id;
  const [leader, setLeader] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: session } = useSession();
  const role = session?.user?.role;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(data => {
        setLeader(data.user);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar líder");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (leader) {
      setForm({
        name: leader.name || '',
        email: leader.email || '',
        phone: leader.phone || '',
        status: leader.status || '',
        sexo: leader.sexo || '',
        estadoCivil: leader.estadoCivil || '',
        ministryId: leader.ministry?.id || '',
        cep: leader.cep || '',
        rua: leader.rua || '',
        numero: leader.numero || '',
        complemento: leader.complemento || '',
        bairro: leader.bairro || '',
        municipio: leader.municipio || '',
        estado: leader.estado || '',
      });
    }
  }, [leader]);

  async function handleSave() {
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          celular: form.phone,
          status: form.status,
          sexo: form.sexo,
          estadoCivil: form.estadoCivil,
          ministryId: form.ministryId,
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          municipio: form.municipio,
          estado: form.estado,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar');
      }
      const data = await res.json();
      setLeader(data.user);
      setEditModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!leader) return <div className="p-8 text-center">Líder não encontrado</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Detalhes do Líder</h1>
        {role === 'ADMIN' && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition"
            onClick={() => setEditModalOpen(true)}
          >
            Editar
          </button>
        )}
      </div>
      <div className="mb-4">
        <div><b>Nome:</b> {leader.name}</div>
        <div><b>E-mail:</b> {leader.email || '-'}</div>
        <div><b>Telefone:</b> {leader.phone || '-'}</div>
        <div><b>Status:</b> {leader.status || '-'}</div>
        <div><b>Ministério:</b> {leader.ministry?.name || '-'}</div>
        <div><b>Igreja:</b> {leader.ministry?.church?.name || '-'}</div>
      </div>
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogTitle>Editar Líder</DialogTitle>
          {form && (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <Input label="Nome" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
              <Input label="E-mail" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} required type="email" />
              <Input label="Telefone" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
              <Select label="Sexo" value={form.sexo} onChange={e => setForm((f: any) => ({ ...f, sexo: e.target.value }))} options={[{ value: '', label: 'Selecione' }, { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]} />
              <Select label="Estado Civil" value={form.estadoCivil} onChange={e => setForm((f: any) => ({ ...f, estadoCivil: e.target.value }))} options={[{ value: '', label: 'Selecione' }, { value: 'solteiro', label: 'Solteiro(a)' }, { value: 'casado', label: 'Casado(a)' }, { value: 'divorciado', label: 'Divorciado(a)' }, { value: 'viuvo', label: 'Viúvo(a)' }]} />
              <Input label="CEP" value={form.cep} onChange={e => setForm((f: any) => ({ ...f, cep: e.target.value }))} />
              <Input label="Rua" value={form.rua} onChange={e => setForm((f: any) => ({ ...f, rua: e.target.value }))} />
              <Input label="Número" value={form.numero} onChange={e => setForm((f: any) => ({ ...f, numero: e.target.value }))} />
              <Input label="Complemento" value={form.complemento} onChange={e => setForm((f: any) => ({ ...f, complemento: e.target.value }))} />
              <Input label="Bairro" value={form.bairro} onChange={e => setForm((f: any) => ({ ...f, bairro: e.target.value }))} />
              <Input label="Município" value={form.municipio} onChange={e => setForm((f: any) => ({ ...f, municipio: e.target.value }))} />
              <Input label="Estado" value={form.estado} onChange={e => setForm((f: any) => ({ ...f, estado: e.target.value }))} />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setEditModalOpen(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
              {formError && <div className="text-red-600 text-sm mt-2">{formError}</div>}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 