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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

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
    if (!selectedId) return;
    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      // Chama API para associar usuário ao ministério como MASTER
      const res = await fetch(`/api/ministries/${ministryId}/associate-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao associar líder master');
      }
      setSubmitSuccess('Líder master associado com sucesso!');
      const user = users.find(u => u.id === selectedId);
      if (user) onSelect(user);
      setSelectedId(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao associar líder master');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleClose() {
    setSelectedId(null);
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
        <DialogTitle>Selecionar Líder Master</DialogTitle>
        <p className="text-gray-600 text-sm mb-4">Busque e selecione um usuário do sistema para associá-lo como novo Líder Master deste ministério. Apenas um usuário pode ser líder master por vez.</p>
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
                <tr key={user.id} className={selectedId === user.id ? "bg-blue-50" : ""}>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedId === user.id}
                      onChange={() => setSelectedId(user.id)}
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
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={handleClose}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={handleAssociate}
            disabled={!selectedId || submitLoading}
          >
            {submitLoading ? 'Associando...' : 'Associar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 