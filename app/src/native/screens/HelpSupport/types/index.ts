export type ScreenView = "support" | "chat";

export interface FaqItem {
  q: string;
  a: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface SupportOption {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  bg: string;
  color: string;
}
