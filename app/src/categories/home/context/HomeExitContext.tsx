import React, { createContext, useContext } from 'react';

export interface HomeExitContextType {
  onClose?: () => void;
}

export const HomeExitContext = createContext<HomeExitContextType>({});

export const useHomeExit = (): HomeExitContextType => useContext(HomeExitContext);

export default HomeExitContext;
