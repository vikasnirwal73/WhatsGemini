import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
};
