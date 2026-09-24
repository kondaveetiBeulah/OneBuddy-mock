import React, { useState, useCallback, useImperativeHandle } from "react";
import { BackHandler } from "react-native";
import { ScreenView } from "../types";
import SupportHomeScreen from "./SupportHomeScreen";
import ChatScreen from "./ChatScreen";

export interface HelpSupportRef {
  canGoBack: () => boolean;
  goBack: () => boolean;
}

export interface HelpSupportProps {
  onClose?: () => void;
}

const HelpAndSupportScreen = React.forwardRef<HelpSupportRef, HelpSupportProps>(
  function HelpAndSupportScreen({ onClose }, ref) {
    const [view, setView] = useState<ScreenView>("support");

    const handleBack = useCallback(() => {
      if (view === "chat") {
        setView("support");
        return true;
      }
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    }, [view, onClose]);

    useImperativeHandle(
      ref,
      () => ({
        canGoBack: () => view === "chat",
        goBack: handleBack,
      }),
      [view, handleBack]
    );

    React.useEffect(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        return handleBack();
      });
      return () => sub.remove();
    }, [handleBack]);

    if (view === "chat") {
      return <ChatScreen onBack={() => setView("support")} />;
    }

    return <SupportHomeScreen onOpenChat={() => setView("chat")} onClose={onClose} />;
  }
);

export default HelpAndSupportScreen;

