import { Phone, MessageCircle } from "lucide-react-native";
import { SupportOption } from "../types";
import { colors } from "../theme/colors";

export const SUPPORT_OPTIONS: SupportOption[] = [
  {
    key: "chat",
    title: "Chat with us",
    subtitle: "Typically replies in a few minutes",
    icon: MessageCircle,
    bg: colors.orangeLight,
    color: colors.orange,
  },
  {
    key: "call",
    title: "Call support",
    subtitle: "Available 9 AM - 9 PM",
    icon: Phone,
    bg: colors.blueLight,
    color: colors.blue,
  },
];
