import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {showPhaseBannerForCurrentRoute} from '../config/launchModulePolicy';

type Props = {
  /** Mismo `name` del Stack, p. ej. `Navegacion`, `Calendario` */
  screenRouteName: string;
  /** Si true y es calendario en F1, muestra aviso de núcleo */
  emphasizeCoreInBeta?: boolean;
};

/**
 * Cinta bajo el título; solo aparece en Fase 1 según `launchModulePolicy`.
 */
export const LaunchPhaseBanner: React.FC<Props> = ({
  screenRouteName,
  emphasizeCoreInBeta = false,
}) => {
  const {show, text} = showPhaseBannerForCurrentRoute(screenRouteName, {
    showOnCoreInBeta: emphasizeCoreInBeta,
  });
  if (!show || !text) {
    return null;
  }
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.txt}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  txt: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {fontFamily: 'system-ui, sans-serif'} : {}),
  },
});
