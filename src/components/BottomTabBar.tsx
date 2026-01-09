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
  {id: 'rutas', label: 'Inicio de ruta', icon: '🗺️', route: 'Navegacion'},
  {id: 'comunidad', label: 'Comunidad', icon: '👥', route: 'Comunidad'},
  {id: 'historial', label: 'Historial', icon: '📜', route: 'Historial'},
  {id: 'calendario', label: 'Calendario', icon: '📅', route: 'Calendario'},
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
    height: Platform.OS === 'ios' ? 85 : 70,
    justifyContent: 'space-around',
    backdropFilter: 'blur(10px)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  icon: {
    fontSize: 28,
    marginBottom: 2,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
    transform: [{scale: 1.2}],
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 122, 255, 0.4)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
});

