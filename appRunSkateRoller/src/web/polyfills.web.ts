/**
 * Debe importarse antes que cualquier pantalla/navegación.
 * Evita fallos de layout o runtime en Safari iOS con el stack nativo en web.
 */
import {enableScreens} from 'react-native-screens';

enableScreens(false);
