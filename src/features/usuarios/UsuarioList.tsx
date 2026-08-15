import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserRole, UserProfile } from "@/types";
import { format } from "date-fns";
import { UsuarioForm } from "./UsuarioForm";
import { Plus, Search, UserCog, UserMinus, ShieldAlert } from "lucide-react";

export function UsuarioList() {
  const { usuarios, loading, updateStatus, deleteUsuario } = useUsuarios();
  const { profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const currentUserRole = profile?.role;
  const isGod = currentUserRole === "GOD";

  // Regra 1 e 13: Filtrar GOD para quem não é GOD
  const filteredUsuarios = usuarios.filter((u) => {
    const role = u.role;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (isGod) return matchesSearch;
    return role !== "GOD" && matchesSearch;
  });

  const handleEdit = (user: UserProfile) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  if (loading)
    return <div className="p-8 text-center font-bold animate-pulse">Carregando usuários...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2"
            id="page-title"
          >
            <UserCog className="text-primary" /> Gestão de Usuários
          </h1>

          <p className="text-muted-foreground font-medium text-xs sm:text-sm">
            Controle de acessos e segurança.
          </p>
        </div>

        <Button
          className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-primary/20"
          onClick={handleNew}
        >
          <Plus size={18} /> NOVO USUÁRIO
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <h2 className="sr-only">Filtros de Usuários</h2>
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Buscar por nome, nickname ou e-mail..."
            className="pl-10 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar usuários"
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black text-xs uppercase">Usuário</TableHead>
              <TableHead className="font-black text-xs uppercase">E-mail</TableHead>
              <TableHead className="font-black text-xs uppercase">Perfil</TableHead>
              <TableHead className="font-black text-xs uppercase">Status</TableHead>
              <TableHead className="font-black text-xs uppercase">Último Acesso</TableHead>
              <TableHead className="text-right font-black text-xs uppercase">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.map((u) => {
              const role = u.role;
              const isGodProfile = role === "GOD";

              return (
                <TableRow key={u.uid} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-bold">
                    <div className="flex flex-col">
                      <span className="text-primary flex items-center gap-1">
                        {isGodProfile && <ShieldAlert size={14} className="text-amber-500" />}
                        {u.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                        @{u.nickname}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{u.email}</span>
                      {u.emailTipo === "FAKE" && (
                        <span className="text-[9px] text-amber-600 font-bold uppercase">
                          Gerado pelo sistema
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isGodProfile ? "destructive" : "outline"}
                      className="font-black text-[10px]"
                    >
                      {role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "ATIVO" ? "default" : "secondary"}
                      className={u.status === "ATIVO" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {u.ultimoAcesso?.toDate
                      ? format(u.ultimoAcesso.toDate(), "dd/MM/yyyy HH:mm")
                      : "Nunca"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isGodProfile && !isGod}
                        className="font-bold text-xs"
                        onClick={() => handleEdit(u)}
                      >
                        Editar
                      </Button>

                      {!isGodProfile && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={
                              u.status === "ATIVO"
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-green-600 hover:text-green-700"
                            }
                            onClick={() =>
                              updateStatus(u.uid, u.status === "ATIVO" ? "BLOQUEADO" : "ATIVO")
                            }
                          >
                            {u.status === "ATIVO" ? "Bloquear" : "Desbloquear"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-red-50"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Excluir usuário?\n\nEssa operação removerá o perfil do sistema e poderá afetar registros históricos.",
                                )
                              ) {
                                deleteUsuario(u.uid);
                              }
                            }}
                          >
                            <UserMinus size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-muted-foreground font-medium italic"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UsuarioForm open={isFormOpen} onOpenChange={setIsFormOpen} userToEdit={userToEdit} />
    </div>
  );
}
