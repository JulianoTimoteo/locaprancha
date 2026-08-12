import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { StatusFrota } from '@/types';
import { cn } from '@/lib/utils';

interface FrotaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFrota | 'TODAS';
  onStatusFilterChange: (status: StatusFrota | 'TODAS') => void;
}

export function FrotaFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: FrotaFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar frota, placa ou equipamento..."
            className="pl-9 font-medium"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant={statusFilter === 'TODAS' ? 'default' : 'outline'} 
          size="sm"
          className="font-black text-[10px] uppercase tracking-widest"
          onClick={() => onStatusFilterChange('TODAS')}
        >
          TODAS
        </Button>
        <Button 
          variant={statusFilter === 'DISPONÍVEL' ? 'default' : 'outline'} 
          size="sm"
          className={cn(
            "font-black text-[10px] uppercase tracking-widest",
            statusFilter === 'DISPONÍVEL' ? "bg-green-600 hover:bg-green-700" : "border-green-500 text-green-600"
          )}
          onClick={() => onStatusFilterChange('DISPONÍVEL')}
        >
          🟢 DISPONÍVEIS
        </Button>
        <Button 
          variant={statusFilter === 'ALOCADO' ? 'default' : 'outline'} 
          size="sm"
          className={cn(
            "font-black text-[10px] uppercase tracking-widest",
            statusFilter === 'ALOCADO' ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-500 text-yellow-600"
          )}
          onClick={() => onStatusFilterChange('ALOCADO')}
        >
          🟡 ALOCADOS
        </Button>
        <Button 
          variant={statusFilter === 'OFICINA' ? 'default' : 'outline'} 
          size="sm"
          className={cn(
            "font-black text-[10px] uppercase tracking-widest",
            statusFilter === 'OFICINA' ? "bg-red-600 hover:bg-red-700" : "border-red-500 text-red-600"
          )}
          onClick={() => onStatusFilterChange('OFICINA')}
        >
          🔴 OFICINA
        </Button>
      </div>
    </div>
  );
}
