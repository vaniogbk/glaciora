'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ColorSelectionValue {
  color: string | null;
  setColor: (color: string) => void;
}

const ColorSelectionContext = createContext<ColorSelectionValue>({ color: null, setColor: () => undefined });

/** Coloris choisi sur la fiche produit, partagé entre la galerie (photo du coloris) et le choix taille / panier. */
export function ColorSelectionProvider({ initial, children }: { initial: string | null; children: ReactNode }) {
  const [color, setColor] = useState<string | null>(initial);
  return <ColorSelectionContext.Provider value={{ color, setColor }}>{children}</ColorSelectionContext.Provider>;
}

export function useColorSelection(): ColorSelectionValue {
  return useContext(ColorSelectionContext);
}
