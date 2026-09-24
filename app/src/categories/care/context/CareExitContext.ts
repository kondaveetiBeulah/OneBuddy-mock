import React, { createContext, useContext } from 'react';

export interface CareExitContextValue {
  onClose: () => void;
}

export const CareExitContext = createContext<CareExitContextValue>({
  onClose: () => {},
});

export const useCareExit = (): CareExitContextValue => useContext(CareExitContext);
