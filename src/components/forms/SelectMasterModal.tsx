"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SelectMasterModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  ministryId: string; // Adicionar prop para saber o ministério
}

export default function SelectMasterModal({ open, onClose, onSelect, ministryId }: SelectMasterModalProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [masters, setMasters] = useState<User[]>([]);

  // Buscar masters já associados
  useEffect(() => {
    if (!open) return;
    fetch(`/api/users?role=MASTER&masterMinistryId=${ministryId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao buscar masters");
        const data = await res.json();
        setMasters(data.users || []);
      })
      .catch(() => setMasters([]));
  }, [open, ministryId]);

  // Buscar usuários disponíveis
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`/api/users?search=${encodeURIComponent(search)}&perPage=20&onlyAvailableMasters=true`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao buscar usuários");
        const data = await res.json();
        setUsers(data.users || []);
      })
      .catch(() => setError("Erro ao buscar usuários"))
      .finally(() => setLoading(false));
  }, [search, open]);

  async function handleAssociate() {
    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      for (const userId of selectedIds) {
        const res = await fetch(`/api/ministries/${ministryId}/associate-master`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Erro ao associar líder master');
        }
      }
      setSubmitSuccess('Líder(es) master associado(s) com sucesso!');
      setSelectedIds([]);
      
      // Atualiza lista de masters
      const mastersRes = await fetch(`/api/users?role=MASTER&masterMinistryId=${ministryId}`);
      if (!mastersRes.ok) throw new Error("Erro ao buscar masters");
      const mastersData = await mastersRes.json();
      setMasters(mastersData.users || []);
      
      // Fechar o modal após um breve delay para mostrar a mensagem de sucesso
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao associar líder master');
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleRemoveMaster(userId: string) {
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/ministries/${ministryId}/dissociate-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao remover líder master');
      }
      setMasters(masters.filter(m => m.id !== userId));
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao remover líder master');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleClose() {
    setSelectedIds([]);
    setSearch("");
    setUsers([]);
    setError("");
    setSubmitError("");
    setSubmitSuccess("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent>
        <DialogTitle>Gerenciar Líderes Master</DialogTitle>
        <p className="text-gray-600 text-sm mb-4">Adicione ou remova líderes master deste ministério. Cada usuário só pode ser master de um ministério.</p>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Líderes Master Atuais</h4>
          {masters.length === 0 && <div className="text-gray-500 text-sm">Nenhum líder master associado.</div>}
          <ul className="divide-y divide-gray-200">
            {masters.map(master => (
              <li key={master.id} className="flex items-center justify-between py-2">
                <span>{master.name} <span className="text-xs text-gray-500">({master.email})</span></span>
                <button className="text-red-600 text-xs ml-2" onClick={() => handleRemoveMaster(master.id)} disabled={submitLoading}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou email"
          className="w-full border rounded px-3 py-2 mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {loading && <div className="text-center py-4">Carregando...</div>}
        {error && <div className="text-red-500 text-center py-2">{error}</div>}
        <div className="max-h-72 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Selecionar</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className={selectedIds.includes(user.id) ? "bg-blue-50" : ""}>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => setSelectedIds(ids => ids.includes(user.id) ? ids.filter(i => i !== user.id) : [...ids, user.id])}
                      aria-label={`Selecionar ${user.name}`}
                    />
                  </td>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-gray-500 text-center py-4">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {submitError && <div className="text-red-600 text-sm mt-2" role="alert">{submitError}</div>}
        {submitSuccess && <div className="text-green-600 text-sm mt-2" role="status">{submitSuccess}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={handleClose}>Fechar</button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={handleAssociate}
            disabled={selectedIds.length === 0 || submitLoading}
          >
            {submitLoading ? 'Associando...' : 'Associar Selecionados'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}