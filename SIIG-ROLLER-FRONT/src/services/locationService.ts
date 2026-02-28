import Geolocation from 'react-native-geolocation-service';
import {Platform, PermissionsAndroid, Alert} from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

class LocationService {
  private watchId: number | null = null;

  /**
   * Solicita permisos de ubicación
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message:
              'La app necesita acceso a tu ubicación para mejorar la búsqueda y el seguimiento de rutas.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error solicitando permisos:', err);
        return false;
      }
    }
    // iOS maneja permisos automáticamente
    return true;
  }

  /**
   * Obtiene la ubicación actual del usuario
   */
  async getCurrentLocation(): Promise<Location | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permiso denegado',
        'Se necesita permiso de ubicación para usar esta función.',
      );
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          });
        },
        error => {
          console.error('Error obteniendo ubicación:', error);
          Alert.alert(
            'Error de ubicación',
            'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.',
          );
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  /**
   * Inicia el seguimiento de ubicación en tiempo real
   */
  startTracking(
    onLocationUpdate: (location: Location) => void,
    onError?: (error: any) => void,
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permiso denegado',
          'Se necesita permiso de ubicación para el seguimiento.',
        );
        resolve(false);
        return;
      }

      this.watchId = Geolocation.watchPosition(
        position => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };
          onLocationUpdate(location);
        },
        error => {
          console.error('Error en seguimiento GPS:', error);
          if (onError) {
            onError(error);
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Actualizar cada 10 metros
          interval: 5000, // Actualizar cada 5 segundos
          fastestInterval: 2000, // Actualización más rápida cada 2 segundos
        },
      );

      resolve(true);
    });
  }

  /**
   * Detiene el seguimiento de ubicación
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Verifica si el GPS está habilitado
   */
  async checkLocationEnabled(): Promise<boolean> {
    // En Android, podemos verificar si el GPS está habilitado
    if (Platform.OS === 'android') {
      try {
        // Esta verificación puede variar según la implementación
        // Por ahora retornamos true y manejamos errores en getCurrentLocation
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}

export default new LocationService();

