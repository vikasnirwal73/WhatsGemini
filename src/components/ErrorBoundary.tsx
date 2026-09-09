import React, { Component, ErrorInfo, ReactNode } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex items-center justify-center h-full min-h-screen bg-background p-4">
          <Card className="border-destructive/30 bg-destructive/10 max-w-md w-full rounded-2xl shadow-strong">
            <CardContent className="p-6 flex gap-4 items-start">
              <div className="w-11 h-11 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <FaExclamationCircle className="text-destructive" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground mb-1.5">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                  {this.state.error?.message || "An unexpected error occurred."}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
