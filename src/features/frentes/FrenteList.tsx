import React, { useState } from 'react';
import { useFrentes } from './useFrentes';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, MapPin } from 'lucide-react';
import { Frente } from '@/types';

export function FrenteList() {
  const { frentes, loading, addFrente, updateFrente, deleteFrente } = useFrentes();
  const { profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [frenteToEdit, setFrenteToEdit] = useState<Frente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    responsavel: '',
    status: 'ATIVA' as 'ATIVA' | 'INATIVA'
  });

  const isAdmin = profile?.role === 'GOD' || profile?.role === 'ADMINISTRADOR';

  const handleOpenForm = (frente?: Frente) => {
    if (frente) {
      setFrenteToEdit(frente);
      setFormData({
        nome: frente.nome,
        codigo: frente.codigo,
        responsavel: frente.responsavel || '',
        status: frente.status
      });
    } else {
      setFrenteToEdit(null);
      setFormData({ nome: '', codigo: '', responsavel: '', status: 'ATIVA' });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.codigo) return;
    
    let success = false;
    if (frenteToEdit) {
      success = await updateFrente(frenteToEdit.id, formData);
    } else {
      const newId = await addFrente(formData);
      success = !!newId;
    }
    
    if (success) {
      setIsFormOpen(false);
    }
  };

  // Ordenação alfabética pelo nome
  const sortedFrentes = [...frentes].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );

  const filtered = sortedFrentes.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center font-bold animate-pulse">Carregando frentes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Frentes de Trabalho</h2>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm">Gerenciamento de locais de operação.</p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto gap-2 font-black tracking-widest shadow-lg shadow-primary/20 uppercase">
            <Plus size={18} /> Nova Frente
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar frente..." 
            className="pl-10 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black text-xs uppercase w-[120px]">Código</TableHead>
              <TableHead className="font-black text-xs uppercase">Nome</TableHead>
              <TableHead className="font-black text-xs uppercase">Responsável</TableHead>
              <TableHead className="font-black text-xs uppercase w-[150px]">Status</TableHead>
              <TableHead className="font-black text-xs uppercase text-right w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((frente) => (
              <TableRow key={frente.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="font-black text-primary uppercase">{frente.codigo}</TableCell>
                <TableCell className="font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {frente.nome}
                </TableCell>
                <TableCell className="font-medium text-sm">{frente.responsavel || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={frente.status === 'ATIVA' ? 'default' : 'secondary'}
                    className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                      frente.status === 'ATIVA' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                    }`}
                  >
                    {frente.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`h-8 px-2 font-black text-[10px] uppercase gap-1 ${
                        frente.status === 'ATIVA' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                      onClick={() => {
                        const newStatus = frente.status === 'ATIVA' ? 'INATIVA' : 'ATIVA';
                        updateFrente(frente.id, { status: newStatus as 'ATIVA' | 'INATIVA' });
                      }}
                    >
                      {frente.status === 'ATIVA' ? 'Desativar' : 'Ativar'}
                    </Button>
                    
                    {isAdmin && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenForm(frente)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => { if(confirm('Excluir frente?')) deleteFrente(frente.id) }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium italic">
                  Nenhuma frente cadastrada ou encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
              {frenteToEdit ? 'Editar Frente' : 'Nova Frente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome da Frente *</label>
              <Input 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: FRENTE 01"
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Código *</label>
              <Input 
                value={formData.codigo}
                onChange={e => setFormData({...formData, codigo: e.target.value})}
                placeholder="Ex: F01"
                className="font-black uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Responsável</label>
              <Input 
                value={formData.responsavel}
                onChange={e => setFormData({...formData, responsavel: e.target.value})}
                placeholder="Nome do encarregado"
                className="font-medium"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="font-bold uppercase">Cancelar</Button>
            <Button onClick={handleSave} className="font-black tracking-widest uppercase">
              {frenteToEdit ? 'ATUALIZAR' : 'SALVAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
