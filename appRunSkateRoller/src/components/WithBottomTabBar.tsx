import React from 'react';
import {View, StyleSheet} from 'react-native';
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
    currentRoute === 'Menu';

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
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

