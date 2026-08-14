import React, { useState, useEffect } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "@/lib/permissions/permissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole, UserProfile } from "@/types";

interface UsuarioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserProfile | null;
}

export function UsuarioForm({ open, onOpenChange, userToEdit }: UsuarioFormProps) {
  const { createUsuario, updateUsuario } = useUsuarios();
  const { profile: currentUser } = useAuth();
  const isGod = currentUser?.role === "GOD";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    nickname: "",
    email: "",
    password: "",
    perfil: "SOLICITANTE" as UserRole,
    status: "ATIVO" as "ATIVO" | "BLOQUEADO" | "INATIVO",
    permissions: [] as string[],
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nome: userToEdit.name || "",
        nickname: userToEdit.nickname || "",
        email: userToEdit.emailTipo === "FAKE" ? "" : userToEdit.email,
        password: "",
        perfil: userToEdit.role || "SOLICITANTE",
        status: userToEdit.status || "ATIVO",
        permissions: userToEdit.permissions || [],
      });
    } else {
      setFormData({
        nome: "",
        nickname: "",
        email: "",
        password: "",
        perfil: "SOLICITANTE",
        status: "ATIVO",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE["SOLICITANTE"] || [],
      });
    }
  }, [userToEdit, open]);

  // Atualiza permissões padrão quando o perfil muda (apenas se não estiver editando ou se explicitamente alterado)
  const handlePerfilChange = (val: UserRole) => {
    const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[val] || [];
    setFormData({
      ...formData,
      perfil: val,
      permissions: defaultPerms,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (userToEdit) {
        await updateUsuario(userToEdit.uid, {
          name: formData.nome,
          nickname: formData.nickname,
          email: formData.email,
          role: formData.perfil,
          status: formData.status,
          permissions: formData.permissions,
        });
      } else {
        await createUsuario({
          nome: formData.nome,
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          perfil: formData.perfil,
          permissions: formData.permissions,
        });
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userToEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-muted-foreground">
              Nome Completo *
            </label>
            <Input
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: (e.target as HTMLInputElement).value })
              }
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-muted-foreground">Nickname *</label>
            <Input
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: (e.target as HTMLInputElement).value })
              }
              placeholder="Ex: joao"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-muted-foreground">
              E-mail (Opcional)
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: (e.target as HTMLInputElement).value })
              }
              placeholder="Ex: joao@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-muted-foreground">
              Senha Provisória
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: (e.target as HTMLInputElement).value })
              }
              placeholder={
                userToEdit ? "Deixe em branco para manter" : "Vazio = Gerar senha forte aleatória"
              }
            />
            {!userToEdit && (
              <p className="text-[10px] text-muted-foreground italic">
                {formData.password
                  ? "O usuário será criado com a senha informada."
                  : "Uma senha forte de 16 caracteres será gerada automaticamente se este campo ficar vazio."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Perfil *</label>
              <Select value={formData.perfil} onValueChange={handlePerfilChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isGod && <SelectItem value="GOD">GOD</SelectItem>}
                  <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
                  <SelectItem value="LIDER">LIDER</SelectItem>
                  <SelectItem value="MOTORISTA">MOTORISTA</SelectItem>
                  <SelectItem value="SOLICITANTE">SOLICITANTE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Status *</label>
              <Select
                value={formData.status}
                onValueChange={(val: "ATIVO" | "BLOQUEADO" | "INATIVO") =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">ATIVO</SelectItem>
                  <SelectItem value="BLOQUEADO">BLOQUEADO</SelectItem>
                  <SelectItem value="INATIVO">INATIVO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase text-primary tracking-tighter">
                Permissões de Acesso
              </label>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {formData.permissions.length} de 9 módulos habilitados
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground italic -mt-2">
              Permissões padrão carregadas pelo perfil. Você pode personalizar o acesso abaixo.
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
              {[
                { id: "dashboard", label: "Home/Dash" },
                { id: "reservas", label: "Agenda" },
                { id: "pranchas", label: "Frota" },
                { id: "equipamentos", label: "Equipamentos" },
                { id: "frentes", label: "Frentes" },
                { id: "relatorios", label: "Relatórios" },
                { id: "analise-coa", label: "Análise COA" },
                { id: "usuarios", label: "Gestão Usuários" },
                { id: "auditoria", label: "Auditoria" },
              ]
                .filter((p) => p.id !== "auditoria" || isGod)
                .map((perm) => (
                  <div key={perm.id} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        checked={formData.permissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter((p) => p !== perm.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className="text-xs font-bold cursor-pointer uppercase"
                      >
                        {perm.label}
                      </label>
                    </div>
                    {perm.id === "auditoria" && (
                      <p className="text-[9px] text-muted-foreground leading-tight italic ml-6">
                        * O detalhamento completo da auditoria é restrito ao nível GOD.
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="font-bold">
              {loading ? "Salvando..." : "SALVAR USUÁRIO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
