import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusFrota } from '@/types';
import { CheckCircle2, Truck, Wrench } from 'lucide-react';

interface FrotaStatusBadgeProps {
  status: StatusFrota;
  className?: string;
}

export function FrotaStatusBadge({ status, className }: FrotaStatusBadgeProps) {
  const getStatusIcon = (status: StatusFrota) => {
    switch (status) {
      case 'DISPONÍVEL': return <CheckCircle2 className="text-green-500" size={14} />;
      case 'ALOCADO': return <Truck className="text-yellow-500" size={14} />;
      case 'OFICINA': return <Wrench className="text-red-500" size={14} />;
    }
  };

  const getBadgeStyle = (status: StatusFrota) => {
    switch (status) {
      case 'DISPONÍVEL': return "border-green-500 text-green-600 bg-green-50";
      case 'ALOCADO': return "border-yellow-500 text-yellow-600 bg-yellow-50";
      case 'OFICINA': return "border-red-500 text-red-600 bg-red-50";
    }
  };

  const getLabel = (status: StatusFrota) => {
    switch (status) {
      case 'DISPONÍVEL': return "DISPONÍVEL";
      case 'ALOCADO': return "ALOCADO";
      case 'OFICINA': return "OFICINA";
    }
  };

  const getEmoji = (status: StatusFrota) => {
    switch (status) {
      case 'DISPONÍVEL': return "🟢";
      case 'ALOCADO': return "🟡";
      case 'OFICINA': return "🔴";
    }
  };

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 font-black text-[10px] uppercase", getBadgeStyle(status), className)}>
      <span>{getEmoji(status)}</span>
      {getLabel(status)}
    </Badge>
  );
}

import { cn } from '@/lib/utils';
