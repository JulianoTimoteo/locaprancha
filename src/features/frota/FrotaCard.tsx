import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Frota, StatusFrota } from '@/types';
import { FrotaStatusBadge } from './FrotaStatusBadge';
import { Edit2, Wrench, CheckCircle2, Truck } from 'lucide-react';
import { canManageFleet } from '@/lib/permissions/permissions';
import { useAuth } from '@/features/auth/AuthContext';

interface FrotaCardProps {
  frota: Frota;
  onEdit: (frota: Frota) => void;
  onWorkshop: (frota: Frota) => void;
  onRelease: (frota: Frota) => void;
}

export function FrotaCard({ frota, onEdit, onWorkshop, onRelease }: FrotaCardProps) {
  const { profile } = useAuth();
  const canManage = canManageFleet(profile);

  return (
    <Card className="shadow-lg border-primary/10 overflow-hidden group">
      <CardHeader className="bg-primary/5 p-4 border-b border-primary/5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-primary">
            <Truck size={24} />
            <h3 className="text-xl font-black tracking-tight">FROTA {frota.frota}</h3>
          </div>
          <FrotaStatusBadge status={frota.status} />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">{frota.placa}</p>
          <p className="text-sm font-bold leading-tight">{frota.nome}</p>
        </div>
        
        {frota.status === 'OFICINA' && frota.justificativaManutencao && (
          <div className="p-2 bg-red-50 rounded border border-red-100 text-[10px]">
            <span className="font-black uppercase block text-red-600 mb-0.5">Motivo Manutenção:</span>
            <span className="font-medium text-red-700">{frota.justificativaManutencao}</span>
          </div>
        )}
      </CardContent>
      {canManage && (
        <CardFooter className="p-2 pt-0 grid grid-cols-2 gap-2">
          {canManage && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="col-span-2 font-black text-xs gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              disabled={frota.status !== 'DISPONÍVEL'}
              onClick={() => {
                const event = new CustomEvent('open-locar', { detail: { pranchaId: frota.frota } });
                window.dispatchEvent(event);
              }}
            >
              <Truck size={14} /> 🟢 LOCAR AGORA
            </Button>
          )}
          <Button 

            variant="ghost" 
            size="sm" 
            className="font-bold text-xs gap-2"
            onClick={() => onEdit(frota)}
          >
            <Edit2 size={14} /> EDITAR
          </Button>
          
          {frota.status === 'OFICINA' ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-bold text-xs gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onRelease(frota)}
            >
              <CheckCircle2 size={14} /> LIBERAR
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-bold text-xs gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={frota.status === 'ALOCADO'}
              onClick={() => onWorkshop(frota)}
            >
              <Wrench size={14} /> OFICINA
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
