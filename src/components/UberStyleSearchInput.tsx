import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';
import locationService, {Location} from '../services/locationService';

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [longitud, latitud]
  text?: string; // Nombre corto del lugar
  place_type?: string[]; // Tipos de lugar
  isCurrentLocation?: boolean; // Si es la ubicación actual
}

interface UberStyleSearchInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectSuggestion?: (suggestion: Suggestion) => void;
  error?: string;
  style?: any;
  labelStyle?: any;
  showCurrentLocation?: boolean; // Mostrar "Mi ubicación actual"
}

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Obtiene la dirección inversa (reverse geocoding) de coordenadas
 */
async function getAddressFromCoordinates(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    if (!MAPBOX_ACCESS_TOKEN || isExampleToken()) {
      return 'Mi ubicación actual';
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&language=es`,
    );

    if (!response.ok) {
      return 'Mi ubicación actual';
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return 'Mi ubicación actual';
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    return 'Mi ubicación actual';
  }
}

export const UberStyleSearchInput: React.FC<UberStyleSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onSelectSuggestion,
  error,
  style,
  labelStyle,
  showCurrentLocation = true,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Obtener ubicación del usuario al montar
  useEffect(() => {
    const getLocation = async () => {
      if (!showCurrentLocation) return;
      
      setLoadingLocation(true);
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
          // Obtener dirección de la ubicación
          const address = await getAddressFromCoordinates(
            location.latitude,
            location.longitude,
          );
          setCurrentLocationAddress(address);
        }
      } catch (error) {
        console.log('No se pudo obtener ubicación');
      } finally {
        setLoadingLocation(false);
      }
    };
    getLocation();
  }, [showCurrentLocation]);

  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si el valor coincide con una sugerencia seleccionada y el campo no está enfocado, no mostrar sugerencias
    if (selectedSuggestion && value === selectedSuggestion && !isFocused) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Si el campo está vacío y está enfocado, mostrar "Ubicación actual" si está disponible
    if (!value || value.trim().length === 0) {
      if (isFocused && showCurrentLocation && userLocation && currentLocationAddress) {
        setSuggestions([
          {
            id: 'current-location',
            place_name: currentLocationAddress,
            center: [userLocation.longitude, userLocation.latitude],
            text: 'Ubicación actual',
            isCurrentLocation: true,
          },
        ]);
        setShowSuggestions(true);
      } else if (isFocused && showCurrentLocation && loadingLocation) {
        // Mostrar mensaje de carga mientras se obtiene la ubicación
        setSuggestions([
          {
            id: 'current-location-loading',
            place_name: 'Obteniendo tu ubicación...',
            center: [0, 0],
            text: 'Obteniendo ubicación...',
            isCurrentLocation: false,
          },
        ]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedSuggestion(null);
      return;
    }

    // Si tiene menos de 2 caracteres, no buscar (más permisivo que antes)
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Solo buscar si el campo está enfocado
    if (!isFocused && value === selectedSuggestion) {
      setShowSuggestions(false);
      return;
    }

    // Debounce: esperar 200ms después de que el usuario deje de escribir (más rápido)
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      if (isFocused) {
        fetchSuggestions(value.trim());
      }
    }, 200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, isFocused, selectedSuggestion, userLocation, currentLocationAddress, showCurrentLocation]);

  const fetchSuggestions = async (query: string) => {
    try {
      if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === '') {
        console.warn('UberStyleSearchInput: Mapbox token no configurado');
        setLoading(false);
        return;
      }

      if (isExampleToken()) {
        console.warn('UberStyleSearchInput: Token de ejemplo no válido');
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      // Usar ubicación del usuario si está disponible
      let proximity = '-99.1332,19.4326'; // Centro de CDMX por defecto
      if (userLocation) {
        proximity = `${userLocation.longitude},${userLocation.latitude}`;
      }

      // Tipos de búsqueda optimizados - similar a Uber
      const types = 'poi,poi.landmark,poi.attraction,poi.business,address,place';

      // Construir URL optimizada
      const baseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: '8', // Menos resultados pero más relevantes
        country: 'mx',
        language: 'es',
        types: types,
        proximity: proximity,
        autocomplete: 'true',
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Error en geocodificación: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('UberStyleSearchInput: Error de Mapbox:', data.error);
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      if (data.features && data.features.length > 0) {
        // Procesar resultados con mejor lógica
        const formattedSuggestions: Suggestion[] = data.features
          .map((feature: any) => {
            const placeName = feature.place_name || '';
            const placeTypes = feature.place_type || [];
            const relevance = feature.relevance || 0;
            const featureCenter = feature.center || [];

            // Score mejorado
            let priorityScore = relevance * 100; // Multiplicar para mejor granularidad

            // Priorizar tipos importantes
            if (placeTypes.includes('poi.landmark')) {
              priorityScore += 20;
            } else if (placeTypes.includes('poi.attraction')) {
              priorityScore += 15;
            } else if (placeTypes.includes('poi.business')) {
              priorityScore += 12;
            } else if (placeTypes.includes('poi')) {
              priorityScore += 8;
            }

            // Priorizar coincidencias exactas
            const queryLower = query.toLowerCase();
            const placeNameLower = placeName.toLowerCase();
            
            if (placeNameLower.startsWith(queryLower)) {
              priorityScore += 30; // Coincidencia al inicio
            } else if (placeNameLower.includes(queryLower)) {
              priorityScore += 15; // Coincidencia en cualquier parte
            }

            // Priorizar lugares cercanos
            if (userLocation && featureCenter.length === 2) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                featureCenter[1],
                featureCenter[0],
              );
              if (distance < 5000) {
                priorityScore += 25 - Math.floor(distance / 200);
              }
            }

            return {
              id: feature.id,
              place_name: placeName,
              center: featureCenter,
              text: placeName.split(',')[0],
              placeType: placeTypes,
              priorityScore,
            };
          })
          .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
          .slice(0, 7) // Máximo 7 resultados
          .map((item: any) => ({
            id: item.id,
            place_name: item.place_name,
            center: item.center,
            text: item.text,
            place_type: item.placeType,
          }));

        // SIEMPRE agregar "Mi ubicación actual" al inicio si está disponible
        const finalSuggestions: Suggestion[] = [];
        if (showCurrentLocation && userLocation && currentLocationAddress) {
          finalSuggestions.push({
            id: 'current-location',
            place_name: currentLocationAddress,
            center: [userLocation.longitude, userLocation.latitude],
            text: 'Ubicación actual',
            isCurrentLocation: true,
          });
        }
        finalSuggestions.push(...formattedSuggestions);

        setSuggestions(finalSuggestions);
        if (isFocused) {
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const displayText = suggestion.isCurrentLocation 
      ? currentLocationAddress 
      : suggestion.place_name;
    
    // Primero actualizar el estado interno
    setSelectedSuggestion(displayText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Llamar al callback primero para que el componente padre actualice su estado
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    
    // Luego actualizar el texto
    onChangeText(displayText);
    
    // Quitar el foco después de un pequeño delay para asegurar que el click se procese
    setTimeout(() => {
      setIsFocused(false);
    }, 100);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (selectedSuggestion && text !== selectedSuggestion) {
      setSelectedSuggestion(null);
    }
    if (isFocused && text.trim().length >= 2) {
      setShowSuggestions(true);
    } else if (text.trim().length < 2) {
      setShowSuggestions(false);
    }
  };

  const getPlaceIcon = (suggestion: Suggestion) => {
    if (suggestion.isCurrentLocation) {
      return '📍';
    }
    const placeName = suggestion.place_name.toLowerCase();
    const placeTypes = suggestion.place_type || [];
    
    if (placeName.includes('metro') || placeName.includes('estación')) {
      return '🚇';
    } else if (placeName.includes('plaza') || placeName.includes('zócalo')) {
      return '🏢';
    } else if (placeName.includes('cine')) {
      return '🎬';
    } else if (placeName.includes('parque')) {
      return '🌳';
    } else if (placeTypes.includes('poi.landmark')) {
      return '📍';
    } else if (placeTypes.includes('poi.business')) {
      return '🏪';
    }
    return '📍';
  };

  const formatPlaceName = (suggestion: Suggestion) => {
    if (suggestion.isCurrentLocation) {
      return {
        main: '📍 Ubicación actual',
        address: currentLocationAddress,
      };
    }
    const parts = suggestion.place_name.split(',');
    return {
      main: parts[0].trim(),
      address: parts.slice(1).join(',').trim(),
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0 && value !== selectedSuggestion) {
              setShowSuggestions(true);
            } else if (value && value.trim().length >= 2 && value !== selectedSuggestion) {
              fetchSuggestions(value.trim());
            } else if (showCurrentLocation && userLocation && currentLocationAddress) {
              // Mostrar "Ubicación actual" cuando se enfoca
              setSuggestions([
                {
                  id: 'current-location',
                  place_name: currentLocationAddress,
                  center: [userLocation.longitude, userLocation.latitude],
                  text: 'Ubicación actual',
                  isCurrentLocation: true,
                },
              ]);
              setShowSuggestions(true);
            } else if (showCurrentLocation && loadingLocation) {
              // Mostrar mensaje de carga
              setSuggestions([
                {
                  id: 'current-location-loading',
                  place_name: 'Obteniendo tu ubicación...',
                  center: [0, 0],
                  text: 'Obteniendo ubicación...',
                  isCurrentLocation: false,
                },
              ]);
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Aumentar el delay para permitir que el click en la sugerencia se procese
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            blurTimeoutRef.current = setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
            }, 300);
          }}
        />

        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              const formatted = formatPlaceName(item);
              
              return (
                <TouchableOpacity
                  style={[
                    styles.suggestionItem,
                    item.isCurrentLocation && styles.currentLocationItem,
                  ]}
                  onPress={() => handleSelectSuggestion(item)}>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionIcon}>{getPlaceIcon(item)}</Text>
                    <View style={styles.suggestionTextContainer}>
                      <Text 
                        style={[
                          styles.suggestionMainText,
                          item.isCurrentLocation && styles.currentLocationText,
                        ]} 
                        numberOfLines={1}>
                        {formatted.main}
                      </Text>
                      {formatted.address && !item.isCurrentLocation && (
                        <Text style={styles.suggestionAddressText} numberOfLines={1}>
                          {formatted.address}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 100,
    elevation: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    maxHeight: 300,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 30,
    zIndex: 10000,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  currentLocationItem: {
    backgroundColor: '#F0F8FF',
    borderBottomColor: '#007AFF',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  currentLocationText: {
    fontWeight: '700',
    color: '#007AFF',
  },
  suggestionAddressText: {
    fontSize: 13,
    color: '#666',
  },
});

