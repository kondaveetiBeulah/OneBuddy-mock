import React, { createContext, useContext } from 'react';

export interface FoodExitContextType {
  onClose?: () => void;
}

export const FoodExitContext = createContext<FoodExitContextType>({});

export const useFoodExit = (): FoodExitContextType => useContext(FoodExitContext);

export default FoodExitContext;
