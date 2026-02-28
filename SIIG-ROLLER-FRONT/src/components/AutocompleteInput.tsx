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
}

interface AutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectSuggestion?: (suggestion: Suggestion) => void;
  error?: string;
  style?: any;
  labelStyle?: any;
  showCategories?: boolean; // Mostrar categorías rápidas
}

const PLACE_CATEGORIES = [
  {id: 'metro', label: '🚇 Metro', query: 'estación metro'},
  {id: 'parque', label: '🌳 Parque', query: 'parque'},
  {id: 'skatepark', label: '🛹 Skatepark', query: 'skatepark'},
  {id: 'museo', label: '🏛️ Museo', query: 'museo'},
  {id: 'cine', label: '🎬 Cine', query: 'cine'},
  {id: 'plaza', label: '🏢 Plaza', query: 'plaza'},
];

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @param lat1 Latitud del primer punto
 * @param lon1 Longitud del primer punto
 * @param lat2 Latitud del segundo punto
 * @param lon2 Longitud del segundo punto
 * @returns Distancia en metros
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

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onSelectSuggestion,
  error,
  style,
  labelStyle,
  showCategories = true,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Obtener ubicación del usuario al montar el componente
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
        }
      } catch (error) {
        console.log('No se pudo obtener ubicación, usando ubicación por defecto');
      }
    };
    getLocation();
  }, []);

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

    // Si el valor está vacío o tiene menos de 3 caracteres, no buscar
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestion(null); // Reset si el usuario borra todo
      return;
    }

    // Solo buscar si el campo está enfocado o si el valor cambió (usuario está escribiendo)
    if (!isFocused && value === selectedSuggestion) {
      setShowSuggestions(false);
      return;
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      if (isFocused) {
        fetchSuggestions(value.trim());
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, isFocused, selectedSuggestion]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const fetchSuggestions = async (query: string, category?: string) => {
    try {
      // Verificar que el token esté disponible
      if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === '') {
        console.warn('AutocompleteInput: Mapbox token no configurado');
        setLoading(false);
        return;
      }

      // Verificar si es el token de ejemplo
      if (isExampleToken()) {
        console.warn(
          'AutocompleteInput: Se está usando el token de ejemplo de Mapbox, que no permite usar las APIs. Por favor, configura tu propio token.',
        );
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      // Construir query de búsqueda - enfoque simplificado similar a Google Maps
      let searchQuery = query.trim();
      const lowerQuery = query.toLowerCase().trim();
      
      // Si hay una categoría, agregarla al query
      if (category) {
        const categoryObj = PLACE_CATEGORIES.find(cat => cat.id === category);
        if (categoryObj) {
          const lowerCategoryQuery = categoryObj.query.toLowerCase();
          // Solo agregar categoría si no está ya en el query
          if (!lowerQuery.includes(lowerCategoryQuery)) {
            searchQuery = `${categoryObj.query} ${searchQuery}`.trim();
          }
        }
      }

      // Coordenadas para proximity - usar ubicación del usuario si está disponible
      // Esto ayuda a priorizar resultados cercanos al usuario
      let proximity = '-99.1332,19.4326'; // Centro Histórico de CDMX por defecto
      if (userLocation) {
        proximity = `${userLocation.longitude},${userLocation.latitude}`;
      }
      
      // Tipos de búsqueda mejorados - incluir más tipos de lugares
      // Permitir POIs, landmarks, atracciones, direcciones, lugares, y establecimientos
      const types = 'poi,poi.landmark,poi.attraction,poi.business,address,place';
      
      // Construir URL de la API con parámetros optimizados
      const baseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: '10', // Aumentar a 10 resultados para mejor selección
        country: 'mx', // Limitar a México
        language: 'es', // Resultados en español
        types: types, // Tipos de lugares
        proximity: proximity, // Priorizar resultados cercanos al centro
        autocomplete: 'true', // Habilitar autocompletado
      });
      
      const response = await fetch(`${baseUrl}?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          console.error(
            'AutocompleteInput: Token de Mapbox inválido o sin permisos. Por favor, configura tu propio token en .env o en src/config/mapbox.ts',
          );
          setSuggestions([]);
          setShowSuggestions(false);
          setLoading(false);
          return;
        }
        throw new Error(`Error en geocodificación: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('AutocompleteInput: Error de Mapbox:', data.error);
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      if (data.features && data.features.length > 0) {
        // Procesar y formatear resultados mejorados para lugares conocidos
        const formattedSuggestions: Suggestion[] = data.features
          .map((feature: any, index: number) => {
            const placeName = feature.place_name || '';
            const placeTypes = feature.place_type || [];
            const relevance = feature.relevance || 0;
            const featureCenter = feature.center || [];
            
            // Calcular score de prioridad mejorado
            let priorityScore = relevance;
            
            // Priorizar POIs y landmarks (lugares conocidos como torres, plazas, cines)
            if (placeTypes.includes('poi.landmark')) {
              priorityScore += 15; // Landmarks muy importantes
            } else if (placeTypes.includes('poi.attraction')) {
              priorityScore += 12; // Atracciones importantes
            } else if (placeTypes.includes('poi.business')) {
              priorityScore += 10; // Negocios (cines, restaurantes, etc.)
            } else if (placeTypes.includes('poi')) {
              priorityScore += 8; // POIs genéricos
            }
            
            // Priorizar si el nombre contiene el query original (coincidencia exacta)
            const queryLower = query.toLowerCase();
            const placeNameLower = placeName.toLowerCase();
            const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
            
            // Bonus por coincidencias de palabras clave
            queryWords.forEach(word => {
              if (placeNameLower.includes(word)) {
                priorityScore += 3;
              }
            });
            
            // Priorizar si el nombre empieza con el query
            if (placeNameLower.startsWith(queryLower)) {
              priorityScore += 10;
            }
            
            // Priorizar lugares cercanos al usuario si tenemos su ubicación
            if (userLocation && featureCenter.length === 2) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                featureCenter[1],
                featureCenter[0],
              );
              // Priorizar lugares más cercanos (hasta 5km)
              if (distance < 5000) {
                priorityScore += 15 - Math.floor(distance / 500);
              }
            }
            
            // Priorizar lugares en Ciudad de México
            if (placeNameLower.includes('ciudad de méxico') || 
                placeNameLower.includes('cdmx') ||
                placeNameLower.includes('mexico city')) {
              priorityScore += 3;
            }
            
            return {
              id: feature.id || `suggestion-${index}`,
              place_name: placeName,
              center: featureCenter,
              priorityScore,
              relevance,
              placeType: placeTypes,
            };
          })
          // Ordenar por score de prioridad (mayor primero)
          .sort((a: any, b: any) => {
            if (b.priorityScore !== a.priorityScore) {
              return b.priorityScore - a.priorityScore;
            }
            return (b.relevance || 0) - (a.relevance || 0);
          })
          // Limitar a 8 resultados más relevantes
          .slice(0, 8)
          .map((item: any) => ({
            id: item.id,
            place_name: item.place_name,
            center: item.center,
            text: item.place_name.split(',')[0], // Nombre corto (primera parte antes de la coma)
            place_type: item.placeType,
          }));

        setSuggestions(formattedSuggestions);
        // Solo mostrar sugerencias si el campo está enfocado
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
    onChangeText(suggestion.place_name);
    setSelectedSuggestion(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsFocused(false); // Quitar el foco después de seleccionar

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    // Si el usuario está editando, resetear la sugerencia seleccionada
    if (selectedSuggestion && text !== selectedSuggestion) {
      setSelectedSuggestion(null);
    }
    // Solo mostrar sugerencias si el campo está enfocado y tiene al menos 3 caracteres
    if (isFocused && text.trim().length >= 3) {
      setShowSuggestions(true);
    } else if (text.trim().length < 3) {
      setShowSuggestions(false);
    }
  };

  const handleCategoryPress = (category: typeof PLACE_CATEGORIES[0]) => {
    const searchTerm = category.query;
    onChangeText(searchTerm);
    setSelectedSuggestion(null);
    setIsFocused(true);
    setLoading(true);
    // Buscar inmediatamente con la categoría
    fetchSuggestions(searchTerm, category.id);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      {showCategories && isFocused && (!value || value.trim().length === 0) && (
        <View style={styles.categoriesContainer}>
          {PLACE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryButton}
              onPress={() => handleCategoryPress(category)}>
              <Text style={styles.categoryButtonText}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            // Si hay sugerencias y el valor no coincide con una seleccionada, mostrarlas
            if (suggestions.length > 0 && value !== selectedSuggestion) {
              setShowSuggestions(true);
            } else if (value && value.trim().length >= 3 && value !== selectedSuggestion) {
              // Si hay texto pero no hay sugerencias cargadas, buscar
              fetchSuggestions(value.trim());
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Retrasar el cierre para permitir que el usuario haga clic en una sugerencia
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            blurTimeoutRef.current = setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
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
              // Determinar icono según el tipo de lugar
              const getPlaceIcon = () => {
                const placeName = item.place_name.toLowerCase();
                const placeTypes = item.place_type || [];
                
                if (placeName.includes('metro') || placeName.includes('estación')) {
                  return '🚇';
                } else if (placeName.includes('skatepark') || placeName.includes('skate park')) {
                  return '🛹';
                } else if (placeName.includes('parque')) {
                  return '🌳';
                } else if (placeName.includes('museo')) {
                  return '🏛️';
                } else if (placeName.includes('plaza') || placeName.includes('zócalo') || placeName.includes('zocalo')) {
                  return '🏛️';
                } else if (placeTypes.includes('poi.landmark')) {
                  return '📍';
                } else if (placeTypes.includes('poi.attraction')) {
                  return '🎯';
                } else if (placeTypes.includes('poi')) {
                  return '🏢';
                } else if (placeTypes.includes('address')) {
                  return '🏠';
                }
                return '📍';
              };
              
              // Formatear el nombre del lugar (nombre corto y dirección)
              const formatPlaceName = () => {
                const parts = item.place_name.split(',');
                if (parts.length > 1) {
                  return {
                    main: parts[0].trim(),
                    address: parts.slice(1).join(',').trim(),
                  };
                }
                return {
                  main: item.place_name,
                  address: '',
                };
              };
              
              const formatted = formatPlaceName();
              
              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionIcon}>{getPlaceIcon()}</Text>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionMainText} numberOfLines={1}>
                        {formatted.main}
                      </Text>
                      {formatted.address ? (
                        <Text style={styles.suggestionAddressText} numberOfLines={1}>
                          {formatted.address}
                        </Text>
                      ) : null}
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
    zIndex: 100, // Z-index alto para que el contenedor esté por encima
    elevation: 20, // Para Android
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
    paddingRight: 40, // Espacio para el indicador de carga
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
    maxHeight: 280, // Altura ajustada para no tapar campos siguientes
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 30, // Elevación muy alta para Android
    zIndex: 10000, // Z-index muy alto para estar por encima de todo
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  suggestionAddressText: {
    fontSize: 13,
    color: '#666',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

