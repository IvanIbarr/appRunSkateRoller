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
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    height: Platform.OS === 'ios' ? 80 : 65,
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    // Estilos adicionales si el tab está activo
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
    transform: [{scale: 1.1}],
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

