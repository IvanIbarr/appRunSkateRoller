import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface BottomTabBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const tabs: TabItem[] = [
  {id: 'rutas', label: 'Ruta', icon: '🛼', route: 'Navegacion'},
  {id: 'comunidad', label: 'Comunidad', icon: '💬', route: 'Comunidad'},
  {id: 'historial', label: 'Historial', icon: '🏆', route: 'Historial'},
  {id: 'calendario', label: 'Calendario', icon: '🗓️', route: 'Calendario'},
  {id: 'menu', label: 'Menú', icon: '☰', route: 'Menu'},
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = currentRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onNavigate(tab.route)}
            activeOpacity={0.7}>
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
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
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    height: Platform.OS === 'ios' ? 86 : 72,
    justifyContent: 'space-around',
    borderRadius: Platform.OS === 'web' ? 0 : 24,
    marginHorizontal: Platform.OS === 'web' ? 0 : 12,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.85,
  },
  iconActive: {
    opacity: 1,
    transform: [{scale: 1.15}],
  },
  label: {
    fontSize: 11,
    color: '#CBD5F5',
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: 'transparent',
    opacity: 0,
  },
  activeDotActive: {
    backgroundColor: '#38BDF8',
    opacity: 1,
  },
});

