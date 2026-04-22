import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {appLog} from './src/utils/clientLogger';

const App: React.FC = () => {
  appLog.info('App web iniciada', {screen: 'App.web'});
  
  try {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </SafeAreaProvider>
    );
  } catch (error) {
    appLog.error(`Error en renderizado: ${error instanceof Error ? error.message : String(error)}`, {
      screen: 'App.web',
      context: {stack: error instanceof Error ? error.stack : undefined},
    });
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar la aplicación</Text>
        <Text style={styles.errorDetail}>{error instanceof Error ? error.message : String(error)}</Text>
        <ActivityIndicator size="large" color="#FF3B30" style={styles.spinner} />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
  },
});

export default App;



