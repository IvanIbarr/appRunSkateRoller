import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {appLog} from './src/utils/clientLogger';

const App: React.FC = () => {
  React.useEffect(() => {
    appLog.info('App nativa montada', {screen: 'App'});
  }, []);
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;

