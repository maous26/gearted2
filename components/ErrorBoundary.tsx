import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service (Sentry, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#f5f5f5',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 16 }}>😕</Text>
          
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Oups ! Une erreur est survenue
          </Text>
          
          <Text
            style={{
              fontSize: 16,
              color: '#666',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            L'application a rencontré un problème inattendu
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                maxHeight: 200,
                width: '100%',
                borderWidth: 1,
                borderColor: '#ddd',
              }}
            >
              <Text style={{ fontSize: 12, color: '#d32f2f', fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text style={{ fontSize: 10, color: '#666', marginTop: 8, fontFamily: 'monospace' }}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: '#4B5D3A',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={this.handleReset}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
