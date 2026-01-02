/**
 * @format
 * Web entry point
 */

console.log('index.web.js: Iniciando aplicación...');

import {AppRegistry} from 'react-native';
import App from './App.web';
import {name as appName} from './app.json';

console.log('index.web.js: Imports cargados, appName:', appName);

// Register the app for web
AppRegistry.registerComponent(appName, () => {
  console.log('index.web.js: Componente registrado');
  return App;
});

console.log('index.web.js: Registrando aplicación...');

// Start the app
const rootTag = document.getElementById('root');
console.log('index.web.js: rootTag encontrado:', !!rootTag);

if (rootTag) {
  try {
    AppRegistry.runApplication(appName, {
      initialProps: {},
      rootTag: rootTag,
    });
    console.log('index.web.js: Aplicación iniciada exitosamente');
  } catch (error) {
    console.error('index.web.js: Error al iniciar aplicación:', error);
    rootTag.innerHTML = '<div style="padding: 20px; font-family: Arial; color: red;">Error al iniciar aplicación: ' + (error.message || String(error)) + '</div>';
  }
} else {
  console.error('index.web.js: No se encontró el elemento #root');
  document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; color: red;">Error: No se encontró el elemento #root en el DOM</div>';
}

