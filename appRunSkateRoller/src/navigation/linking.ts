import type {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from './types';

/**
 * Enlaces runskateroller://seguimiento/<uuid> (WhatsApp / redes pueden abrir la app si el SO asocia el esquema).
 * URLs https://...?seguimiento= se manejan aparte en AppNavigator con Linking.getInitialURL / addEventListener.
 */
export const navigationLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ['runskateroller://'],
  config: {
    screens: {
      Navegacion: {
        path: 'seguimiento/:seguimientoId',
      },
    },
  },
};
