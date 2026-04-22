import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {BottomTabBar} from './BottomTabBar';

interface WithBottomTabBarProps {
  children: React.ReactNode;
}

export const WithBottomTabBar: React.FC<WithBottomTabBarProps> = ({
  children,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const handleTabNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  const currentRoute = route.name;

  // Mostrar la barra solo en las pantallas principales
  const showTabBar =
    currentRoute === 'Navegacion' ||
    currentRoute === 'Comunidad' ||
    currentRoute === 'Historial' ||
    currentRoute === 'Calendario' ||
    currentRoute === 'RollerTips' ||
    currentRoute === 'Marketing' ||
    currentRoute === 'Menu';

  /**
   * Importante:
   * La barra inferior NO es absoluta (está fuera del content), así que no necesitamos
   * reservar espacio extra con paddingBottom; eso solo crea un hueco visible.
   */
  const bottomInset = 0;

  return (
    <View style={styles.container}>
      <View style={[styles.content, showTabBar && {paddingBottom: bottomInset}]}>
        {children}
      </View>
      {showTabBar && (
        <BottomTabBar
          currentRoute={currentRoute}
          onNavigate={handleTabNavigate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

