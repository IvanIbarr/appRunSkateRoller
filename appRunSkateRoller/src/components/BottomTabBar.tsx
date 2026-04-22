import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {isTabAttenuated, isTabInBar} from '../config/launchModulePolicy';

interface TabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  route: string;
}

interface BottomTabBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const tabs: TabItem[] = [
  {id: 'rutas', label: 'Ruta', shortLabel: 'Ruta', icon: '🛼', route: 'Navegacion'},
  {id: 'comunidad', label: 'Chat', shortLabel: 'Chat', icon: '💬', route: 'Comunidad'},
  {id: 'historial', label: 'Historial', shortLabel: 'Hist.', icon: '🏆', route: 'Historial'},
  {id: 'calendario', label: 'Calendario', shortLabel: 'Cal.', icon: '🗓️', route: 'Calendario'},
  {id: 'rollertips', label: 'Rollertips', shortLabel: 'Tips', icon: '🎬', route: 'RollerTips'},
  {id: 'marketing', label: 'Marketing', shortLabel: 'Mkt.', icon: '📣', route: 'Marketing'},
  {id: 'menu', label: 'Menú', shortLabel: 'Menú', icon: '☰', route: 'Menu'},
];

/**
 * Por debajo de esto usamos etiquetas cortas (sin ScrollView: evita pantalla en blanco en Safari móvil).
 * Con 7 pestañas, en web el ancho útil suele ser menor que `window.innerWidth` (p. ej. barra del navegador),
 * así que el umbral debe ser generoso para no volver a solapar textos.
 */
// Ajustado para que en móvil se mantengan etiquetas completas como en la referencia,
// y solo se acorten en anchos realmente pequeños.
const SHORT_LABEL_BREAKPOINT = 360;

function readLayoutWidth(winW: number): number {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const el = document.documentElement;
    const cw = el?.clientWidth;
    if (typeof cw === 'number' && cw > 0) {
      return cw;
    }
  }
  return winW > 0 ? winW : 390;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const {width: winW} = useWindowDimensions();
  const layoutW = readLayoutWidth(winW);
  const useShortLabels = layoutW < SHORT_LABEL_BREAKPOINT;

  const visibleTabs = useMemo(
    () => tabs.filter(t => isTabInBar(t.id)),
    [],
  );

  return (
    <View style={styles.container}>
      {visibleTabs.map((tab) => {
        const isActive = currentRoute === tab.route;
        const labelText = useShortLabels ? tab.shortLabel : tab.label;
        const attenuate = isTabAttenuated(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onNavigate(tab.route)}
            activeOpacity={0.7}
            accessibilityState={{selected: isActive}}>
            <Text
              style={[
                styles.icon,
                isActive && styles.iconActive,
                attenuate && !isActive && styles.iconAttenuate,
              ]}
              allowFontScaling={false}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                attenuate && !isActive && styles.labelAttenuate,
              ]}
              numberOfLines={1}
              allowFontScaling={false}>
              {labelText}
            </Text>
            <View style={[styles.activeDot, isActive && styles.activeDotActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    minHeight: Platform.OS === 'ios' ? 74 : 62,
    // 'center' en el eje cruzado puede hacer que en web algunos hijos no repartan bien el ancho con flex:1
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderRadius: Platform.OS === 'web' ? 0 : 24,
    marginHorizontal: Platform.OS === 'web' ? 0 : 12,
    marginBottom: 0,
  },
  tabItem: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 2,
    opacity: 0.88,
    textAlign: 'center',
  },
  iconActive: {
    opacity: 1,
    transform: [{scale: 1.06}],
  },
  iconAttenuate: {
    opacity: 0.65,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    color: '#E2E8F0',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 0,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(56, 189, 248, 0.45)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 3,
  },
  labelAttenuate: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
    backgroundColor: 'transparent',
    opacity: 0,
  },
  activeDotActive: {
    backgroundColor: '#38BDF8',
    opacity: 1,
  },
});
