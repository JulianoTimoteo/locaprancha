import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, BarChart3 } from "lucide-react";
import "./RadialMenu.css";

interface RadialMenuProps {
  items: {
    id: string;
    label: string;
    icon: any;
    onClick: () => void;
    active: boolean;
  }[];
}

export function RadialMenu({ items }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Lógica para arrastar o dedo (touch move) com snap e haptic feedback simulado
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOpen) return;
    const touch = e.touches[0];
    if (!touch) return;

    // Usar elementFromPoint para detectar colisão com os itens
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    // Encontrar qual botão está sob o dedo (ou seus filhos como o ícone)
    const index = itemsRefs.current.findIndex(
      (ref) => ref && (ref === element || ref.contains(element)),
    );

    if (index !== -1 && index !== hoveredIndex) {
      setHoveredIndex(index);

      // Feedback tátil se disponível
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isOpen && hoveredIndex !== null && items[hoveredIndex]) {
      items[hoveredIndex].onClick();
      setIsOpen(false);
      setHoveredIndex(null);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setHoveredIndex(null);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      ref={menuRef}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop para foco quando o menu estiver aberto */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[65] transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside className={cn("menu-radial-container", isOpen && "is-open")}>
        <input
          type="checkbox"
          id="radial-toggle"
          className="hidden-checkbox"
          checked={isOpen}
          onChange={toggleMenu}
        />

        {/* Botão de Toggle - Círculo com + no meio, sem preenchimento, animação de pulso suave */}
        <label
          htmlFor="radial-toggle"
          className="radial-toggle-btn relative"
          aria-label={isOpen ? "Fechar menu de opções" : "Abrir menu de opções"}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {isOpen ? (
              <X className="text-primary w-8 h-8 animate-in zoom-in duration-300" />
            ) : (
              <span className="text-primary text-6xl font-light leading-none flex items-center justify-center">
                +
              </span>
            )}
          </div>
        </label>

        {items.map((item, index) => (
          <li
            key={item.id}
            className="radial-item"
            style={{ "--i": index, "--total": items.length } as React.CSSProperties}
          >
            <button
              ref={(el) => {
                itemsRefs.current[index] = el;
              }}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "radial-anchor group",
                (item.active || hoveredIndex === index) && "radial-anchor-active",
              )}
              title={item.label}
              aria-label={`Navegar para ${item.label}`}
            >
              <item.icon
                size={22}
                className={cn(
                  "radial-icon",
                  item.active || hoveredIndex === index ? "text-white" : "text-primary",
                )}
              />
              <span className={cn("radial-label", hoveredIndex === index && "opacity-100")}>
                {item.id === "usuarios" ? "Gestão de Usuários" : item.label}
              </span>
            </button>
          </li>
        ))}
      </aside>
    </div>
  );
}
