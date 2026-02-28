import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface CircularMetricProps {
  value: string | number;
  label: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const CircularMetric: React.FC<CircularMetricProps> = ({
  value,
  label,
  size = 120,
  color = '#007AFF',
  backgroundColor = '#F0F8FF',
}) => {
  const radius = size / 2;
  const fontSize = size * 0.25;
  const labelSize = size * 0.12;

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor,
            borderWidth: 3,
            borderColor: color,
          },
        ]}>
        <Text style={[styles.value, {fontSize, color}]}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Text>
        <Text style={[styles.label, {fontSize: labelSize}]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  label: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});


