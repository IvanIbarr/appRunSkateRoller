import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface SpeedometerProps {
  speed: number; // velocidad en km/h
  maxSpeed?: number; // velocidad máxima para la escala (default: 50 km/h)
  size?: number;
  color?: string;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  maxSpeed = 50,
  size = 140,
}) => {
  // Colores según velocidad
  const getColor = () => {
    if (speed < 10) return '#34C759'; // Verde (lento)
    if (speed < 25) return '#FF9500'; // Naranja (medio)
    return '#FF3B30'; // Rojo (rápido)
  };

  const speedColor = getColor();
  const radius = size / 2;
  const backgroundColor = speed < 10 
    ? '#E8F5E9' 
    : speed < 25 
    ? '#FFF3E0' 
    : '#FFEBEE';

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 4,
            borderColor: speedColor,
            backgroundColor,
          },
        ]}>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, {color: speedColor, fontSize: size * 0.22}]}>
            {speed.toFixed(1)}
          </Text>
          <Text style={[styles.unit, {fontSize: size * 0.11}]}>km/h</Text>
        </View>
        {/* Indicador de velocidad con puntos */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicatorDot, speed >= 10 && styles.indicatorDotActive, {backgroundColor: speed >= 10 ? speedColor : '#E0E0E0'}]} />
          <View style={[styles.indicatorDot, speed >= 25 && styles.indicatorDotActive, {backgroundColor: speed >= 25 ? speedColor : '#E0E0E0'}]} />
        </View>
      </View>
      <Text style={[styles.label, {fontSize: size * 0.11}]}>Vel. Promedio</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  unit: {
    color: '#666',
    fontWeight: '500',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 4,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});

