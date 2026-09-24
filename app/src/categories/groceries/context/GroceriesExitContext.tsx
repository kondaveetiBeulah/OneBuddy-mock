import React, { createContext, useContext } from 'react';

export interface GroceriesExitContextType {
  onClose?: () => void;
}

export const GroceriesExitContext = createContext<GroceriesExitContextType>({});

export const useGroceriesExit = (): GroceriesExitContextType => useContext(GroceriesExitContext);

export default GroceriesExitContext;
