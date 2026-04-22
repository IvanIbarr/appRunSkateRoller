import React, {useEffect, useMemo, useRef} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';

type LngLat = [number, number]; // [lng, lat]

interface MapboxMapProps {
  origin: string;
  destination: string;
  originCoords?: LngLat | null;
  destinationCoords?: LngLat | null;
  language?: string;
  userCoords?: LngLat | null;
  previewCoords?: LngLat | null;
  routeGeometry?: any;
  calculateRoute?: boolean;
  trackingActive?: boolean;
  trackingPoints?: Array<{lat: number; lng: number}>;
  followMode?: boolean;
  followZoom?: number;
  followPitch?: number;
  styleVariant?: 'day' | 'night';
}

const DEFAULT_CENTER: LngLat = [-99.1332, 19.4326];

const computeBearingDeg = (a: {lat: number; lng: number}, b: {lat: number; lng: number}): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

export const MapboxMap: React.FC<MapboxMapProps> = ({
  originCoords,
  destinationCoords,
  userCoords,
  previewCoords,
  routeGeometry,
  trackingActive = false,
  trackingPoints = [],
  followMode = false,
  followZoom = 17.4,
  followPitch = 58,
  styleVariant = 'day',
}) => {
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || isExampleToken()) {
      return;
    }
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }, []);

  const navigationFollow = followMode || trackingActive;
  const lastPoint = trackingPoints.length > 0 ? trackingPoints[trackingPoints.length - 1] : null;

  const centerToShow: LngLat = useMemo(() => {
    if (previewCoords && previewCoords.length >= 2) return previewCoords;
    if (originCoords && originCoords.length >= 2) return originCoords;
    if (userCoords && userCoords.length >= 2) return userCoords;
    return DEFAULT_CENTER;
  }, [previewCoords, originCoords, userCoords]);

  const routeFeatureCollection = useMemo(() => {
    if (!routeGeometry || !routeGeometry.coordinates) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: routeGeometry,
        },
      ],
    };
  }, [routeGeometry]);

  const previewFeatureCollection = useMemo(() => {
    if (!previewCoords) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {kind: 'preview'},
          geometry: {type: 'Point', coordinates: previewCoords},
        },
      ],
    };
  }, [previewCoords]);

  const followPoint = useMemo(() => {
    if (!navigationFollow) return null;
    if (lastPoint) return {lat: lastPoint.lat, lng: lastPoint.lng};
    if (originCoords) return {lat: originCoords[1], lng: originCoords[0]};
    if (userCoords) return {lat: userCoords[1], lng: userCoords[0]};
    return null;
  }, [navigationFollow, lastPoint, originCoords, userCoords]);

  const followBearing = useMemo(() => {
    if (!navigationFollow) return 0;
    if (trackingPoints.length >= 2) {
      const a = trackingPoints[trackingPoints.length - 2];
      const b = trackingPoints[trackingPoints.length - 1];
      return computeBearingDeg(a, b);
    }
    return 0;
  }, [navigationFollow, trackingPoints]);

  // Centrado estilo Uber/Google al entrar en modo seguimiento.
  useEffect(() => {
    if (!navigationFollow || !followPoint) return;
    cameraRef.current?.setCamera?.({
      centerCoordinate: [followPoint.lng, followPoint.lat],
      zoomLevel: followZoom,
      pitch: followPitch,
      heading: followBearing,
      animationDuration: 650,
    });
  }, [navigationFollow, followPoint, followZoom, followPitch, followBearing]);

  if (!MAPBOX_ACCESS_TOKEN || isExampleToken()) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={styleVariant === 'night' ? Mapbox.StyleURL.NavigationNight : Mapbox.StyleURL.NavigationDay}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        rotateEnabled
        pitchEnabled>
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: centerToShow,
            zoomLevel: 13,
            pitch: 0,
            heading: 0,
          }}
        />

        {/* Punto azul del usuario */}
        <Mapbox.LocationPuck
          visible
          pulsing={{
            isEnabled: true,
            color: '#1D4ED8',
            radius: 40,
          }}
        />

        {/* Pin rojo de confirmación */}
        {previewFeatureCollection && (
          <Mapbox.ShapeSource id="previewPin" shape={previewFeatureCollection}>
            <Mapbox.CircleLayer
              id="previewPinCircle"
              style={{
                circleColor: '#EF4444',
                circleRadius: 9,
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 3,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Ruta */}
        {routeFeatureCollection && (
          <Mapbox.ShapeSource id="routeLine" shape={routeFeatureCollection}>
            <Mapbox.LineLayer
              id="routeLineLayer"
              style={{
                lineColor: '#38BDF8',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Patín (seguimiento) */}
        {navigationFollow && followPoint && (
          <Mapbox.MarkerView id="skateMarker" coordinate={[followPoint.lng, followPoint.lat]}>
            <View style={[styles.skateDot, {transform: [{rotate: `${followBearing}deg`}]}]} />
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, width: '100%', height: '100%'},
  map: {flex: 1},
  placeholder: {flex: 1, backgroundColor: '#111827'},
  skateDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 14,
  },
});

