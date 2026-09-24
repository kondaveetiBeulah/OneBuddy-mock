import React, { Component, ReactNode } from "react";
import { View, Text, ScrollView } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#111", justifyContent: "center" }}>
          <Text style={{ color: "red", fontSize: 20, fontWeight: "bold" }}>Something went wrong.</Text>
          <ScrollView style={{ marginTop: 20 }}>
            <Text style={{ color: "#fff", fontFamily: "monospace" }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ color: "#aaa", fontFamily: "monospace", marginTop: 10 }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
