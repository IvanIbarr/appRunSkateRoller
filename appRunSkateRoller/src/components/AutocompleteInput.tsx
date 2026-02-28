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

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [longitud, latitud]
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
];

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Construir query con categoría si existe
      let searchQuery = query;
      const lowerQuery = query.toLowerCase();
      
      // Verificar si ya incluye "Ciudad de México", "CDMX" o "Mexico City"
      const hasCityContext = 
        lowerQuery.includes('ciudad de méxico') || 
        lowerQuery.includes('cdmx') || 
        lowerQuery.includes('mexico city') ||
        lowerQuery.includes('distrito federal') ||
        lowerQuery.includes('df');
      
      if (category) {
        const categoryObj = PLACE_CATEGORIES.find(cat => cat.id === category);
        if (categoryObj) {
          // Si el query ya contiene el término de la categoría, usar solo el query
          const lowerCategoryQuery = categoryObj.query.toLowerCase();
          if (lowerQuery.includes(lowerCategoryQuery)) {
            searchQuery = query.trim();
          } else {
            searchQuery = query.trim() ? `${categoryObj.query} ${query}`.trim() : categoryObj.query;
          }
          // Agregar contexto de Ciudad de México si no está presente
          if (!hasCityContext && !searchQuery.toLowerCase().includes('ciudad de méxico')) {
            searchQuery = `${searchQuery} Ciudad de México`.trim();
          }
        }
      } else {
        // Detectar búsquedas de estaciones de metro (varios formatos)
        // Formato 1: "metro [nombre]" o "metro pantitlan"
        const metroMatch = query.trim().match(/^metro\s+(.+)$/i);
        
        if (metroMatch) {
          // Usuario escribió "metro [nombre]" (ej: "metro mixcoac", "metro pantitlan")
          const stationName = metroMatch[1].trim();
          searchQuery = `Estación Metro ${stationName} Ciudad de México`.trim();
        } else if (lowerQuery.includes('metro') || lowerQuery.includes('estación')) {
          // Si contiene "metro" o "estación" pero no en formato "metro [nombre]"
          if (!lowerQuery.includes('estación metro')) {
            searchQuery = `estación metro ${query.replace(/(metro|estación)/gi, '').trim()}`.trim();
          } else {
            searchQuery = query.trim();
          }
          // Agregar contexto de Ciudad de México si no está presente
          if (!hasCityContext && !searchQuery.toLowerCase().includes('ciudad de méxico')) {
            searchQuery = `${searchQuery} Ciudad de México`.trim();
          }
        } else if (lowerQuery.includes('skatepark') || lowerQuery.includes('skate park') || lowerQuery.includes('skate')) {
          // Detectar si el usuario busca "skatepark [nombre]" o "[nombre] skatepark"
          const skateparkMatch = query.trim().match(/^(?:skate\s*)?park\s+(.+)$/i) || 
                                 query.trim().match(/^skatepark\s+(.+)$/i) ||
                                 query.trim().match(/^skate\s+(.+)$/i);
          
          if (skateparkMatch) {
            // Usuario escribió "skatepark [nombre]" o "skate park [nombre]", buscar específicamente
            const parkName = skateparkMatch[1].trim();
            searchQuery = `Skate Park ${parkName} Ciudad de México`.trim();
          } else if (lowerQuery.includes('skatepark') || lowerQuery.includes('skate park')) {
            // Si ya contiene "skatepark" o "skate park", mantenerlo y agregar contexto
            searchQuery = query.trim();
            if (!hasCityContext && !searchQuery.toLowerCase().includes('ciudad de méxico')) {
              searchQuery = `${searchQuery} Ciudad de México`.trim();
            }
          } else {
            // Si solo contiene "skate", agregar "park" y contexto
            searchQuery = `skatepark ${query.replace(/skate/gi, '').trim()}`.trim();
            if (!hasCityContext && !searchQuery.toLowerCase().includes('ciudad de méxico')) {
              searchQuery = `${searchQuery} Ciudad de México`.trim();
            }
          }
        } else if (lowerQuery.includes('museo') && !lowerQuery.startsWith('museo')) {
          searchQuery = `museo ${query.replace(/museo/gi, '').trim()}`.trim();
        } else if (lowerQuery.includes('parque') && !lowerQuery.startsWith('parque')) {
          searchQuery = `parque ${query.replace(/parque/gi, '').trim()}`.trim();
        } else if (lowerQuery.includes('bellas artes')) {
          // Para "Bellas Artes", buscar específicamente el Palacio de Bellas Artes en Centro Histórico
          if (!lowerQuery.includes('palacio')) {
            // Si no menciona "palacio", buscar específicamente el Palacio de Bellas Artes
            searchQuery = 'Palacio de Bellas Artes, Centro Histórico, Ciudad de México';
          } else {
            // Si ya menciona palacio, mantener y agregar contexto
            searchQuery = query.trim();
            if (!hasCityContext && !searchQuery.toLowerCase().includes('ciudad de méxico')) {
              searchQuery = `${searchQuery} Centro Histórico Ciudad de México`.trim();
            }
          }
        } else {
          // Detectar lugares comunes y coloquiales
          const trimmedQuery = query.trim();
          
          // Zócalo (varias formas)
          if (/^zócalo|^zocalo/i.test(trimmedQuery)) {
            if (/zócalo\s+de\s+la\s+cdmx|zocalo\s+de\s+la\s+cdmx|zócalo\s+cdmx|zocalo\s+cdmx/i.test(trimmedQuery)) {
              searchQuery = 'Zócalo Ciudad de México';
            } else {
              searchQuery = 'Zócalo Ciudad de México';
            }
          }
          // Liverpool (con ubicación o sin ella)
          else if (/^liverpool/i.test(trimmedQuery)) {
            if (/liverpool\s+insurgentes/i.test(trimmedQuery)) {
              searchQuery = 'Liverpool Insurgentes Ciudad de México';
            } else {
              searchQuery = `${trimmedQuery} Ciudad de México`;
            }
          }
          // Plaza (varios nombres)
          else if (/^plaza/i.test(trimmedQuery)) {
            if (/plaza\s+antena/i.test(trimmedQuery)) {
              searchQuery = 'Plaza Antena Ciudad de México';
            } else {
              searchQuery = `${trimmedQuery} Ciudad de México`;
            }
          }
          // Para otros lugares comunes sin dirección completa
          else if (!hasCityContext) {
            // Detectar si parece ser un nombre de lugar (no dirección completa)
            const looksLikePlaceName = trimmedQuery.length < 50 && 
                                      !trimmedQuery.match(/\d{5}/) && // Sin código postal
                                      !trimmedQuery.match(/^\d+/) && // No empieza con número
                                      (!trimmedQuery.includes(',') || trimmedQuery.split(',').length <= 2); // Máximo 2 comas
            
            if (looksLikePlaceName) {
              // Agregar "Ciudad de México" para mejorar resultados
              searchQuery = `${trimmedQuery} Ciudad de México`.trim();
            } else {
              searchQuery = trimmedQuery;
            }
          } else {
            searchQuery = trimmedQuery;
          }
        }
      }

      // Coordenadas para proximity (mejora relevancia)
      // Detectar búsquedas específicas y usar coordenadas más precisas
      let proximity = '-99.1332,19.4326'; // Centro Histórico por defecto
      
      // Si es búsqueda de Bellas Artes, usar coordenadas específicas del Palacio
      const lowerSearchQueryForProximity = searchQuery.toLowerCase();
      if (lowerSearchQueryForProximity.includes('bellas artes') || lowerSearchQueryForProximity.includes('palacio de bellas artes')) {
        proximity = '-99.1418092,19.4363936'; // Coordenadas exactas del Palacio de Bellas Artes
      }
      
      // Detectar tipo de búsqueda para usar tipos específicos
      const lowerSearchQuery = searchQuery.toLowerCase();
      const isMetroSearch = lowerSearchQuery.includes('metro') || lowerSearchQuery.includes('estación metro');
      const isSkateparkSearch = lowerSearchQuery.includes('skatepark') || lowerSearchQuery.includes('skate park');
      const isBellasArtesSearch = lowerSearchQuery.includes('bellas artes') || lowerSearchQuery.includes('palacio de bellas artes');
      const isZocaloSearch = lowerSearchQuery.includes('zócalo') || lowerSearchQuery.includes('zocalo');
      const isPlaceSearch = lowerSearchQuery.includes('plaza') || lowerSearchQuery.includes('liverpool') || 
                           lowerSearchQuery.includes('centro comercial') || lowerSearchQuery.includes('mall');
      
      let types;
      if (isMetroSearch) {
        types = 'poi,poi.landmark,address'; // Para metro, priorizar POIs y landmarks
      } else if (isSkateparkSearch) {
        types = 'poi,poi.landmark,poi.attraction,address'; // Para skatepark, priorizar POIs, landmarks y atracciones
      } else if (isBellasArtesSearch) {
        types = 'poi.landmark,poi.attraction,poi'; // Para Bellas Artes, SOLO POIs y landmarks (NO addresses)
      } else if (isZocaloSearch || isPlaceSearch) {
        types = 'poi.landmark,poi.attraction,poi,address'; // Para plazas y lugares conocidos, incluir POIs y landmarks
      } else {
        types = 'poi.landmark,poi.attraction,poi,address'; // Para otros, priorizar landmarks y atracciones
      }
      
      // Priorizar landmarks y POIs importantes, aumentar límite para mejor selección
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery,
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=10&country=mx&language=es&types=${types}&proximity=${proximity}`,
      );

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
        // Filtrar y priorizar resultados en Ciudad de México con mejor lógica
        const formattedSuggestions: Suggestion[] = data.features
          .map((feature: any, index: number) => {
            const placeName = feature.place_name || '';
            const lowerPlaceName = placeName.toLowerCase();
            
            // Calcular score de prioridad
            let priorityScore = feature.relevance || 0;
            
            // Priorizar lugares en Ciudad de México
            if (lowerPlaceName.includes('ciudad de méxico') || 
                lowerPlaceName.includes('cdmx') ||
                lowerPlaceName.includes('mexico city') ||
                lowerPlaceName.includes('centro histórico')) {
              priorityScore += 10;
            }
            
            // Priorizar estaciones de metro específicamente
            const isMetroStation = lowerPlaceName.includes('metro') || 
                                  lowerPlaceName.includes('estación metro') ||
                                  lowerPlaceName.includes('estacion metro') ||
                                  lowerPlaceName.includes('stc metro') ||
                                  lowerPlaceName.includes('estación del metro');
            
            // Si el query original buscaba metro, dar máxima prioridad a estaciones de metro
            const originalQueryLower = query.toLowerCase();
            if (isMetroStation && (originalQueryLower.includes('metro') || category === 'metro')) {
              priorityScore += 25; // Máxima prioridad para estaciones de metro cuando se busca específicamente
            } else if (isMetroStation) {
              priorityScore += 15; // Alta prioridad para estaciones de metro en general
            }
            
            // Priorizar skateparks específicamente
            const isSkatepark = lowerPlaceName.includes('skatepark') || 
                               lowerPlaceName.includes('skate park') ||
                               lowerPlaceName.includes('skate-park');
            
            if (isSkatepark && (originalQueryLower.includes('skate') || originalQueryLower.includes('skatepark') || category === 'skatepark')) {
              priorityScore += 25; // Máxima prioridad para skateparks cuando se busca específicamente
            } else if (isSkatepark) {
              priorityScore += 15; // Alta prioridad para skateparks en general
            }
            
            // Priorizar landmarks y atracciones (lugares más conocidos)
            const placeTypes = feature.place_type || [];
            if (placeTypes.includes('poi.landmark')) {
              priorityScore += 15; // Landmarks son muy importantes
            } else if (placeTypes.includes('poi.attraction')) {
              priorityScore += 12; // Atracciones también muy importantes
            } else if (placeTypes.includes('poi')) {
              priorityScore += 5; // POIs genéricos
            }
            
            // Priorizar si el nombre coincide exactamente o está muy cerca del query original
            const queryLower = query.toLowerCase();
            if (lowerPlaceName.startsWith(queryLower) || lowerPlaceName.includes(queryLower + ',')) {
              priorityScore += 15;
            }
            
            // Penalizar si tiene código postal muy específico (menos conocido)
            if (placeName.match(/\d{5}/)) {
              priorityScore -= 2;
            }
            
            // Priorizar lugares en el Centro Histórico o zonas conocidas
            if (lowerPlaceName.includes('centro histórico') || 
                lowerPlaceName.includes('centro historico') ||
                lowerPlaceName.includes('alameda') ||
                lowerPlaceName.includes('zócalo') ||
                lowerPlaceName.includes('zocalo')) {
              priorityScore += 8;
            }
            
            // Priorizar lugares conocidos específicos
            // originalQueryLower ya está declarado arriba, no redeclarar
            if ((originalQueryLower.includes('zócalo') || originalQueryLower.includes('zocalo')) && 
                (lowerPlaceName.includes('zócalo') || lowerPlaceName.includes('zocalo'))) {
              priorityScore += 20; // Priorizar Zócalo cuando se busca específicamente
            }
            
            if (originalQueryLower.includes('liverpool') && lowerPlaceName.includes('liverpool')) {
              priorityScore += 15; // Priorizar Liverpool cuando se busca específicamente
            }
            
            if (originalQueryLower.includes('plaza') && lowerPlaceName.includes('plaza')) {
              priorityScore += 12; // Priorizar plazas cuando se busca específicamente
            }
            
            // Priorizar específicamente el Palacio de Bellas Artes y filtrar calles
            const isStreet = lowerPlaceName.includes('calle') || 
                            lowerPlaceName.includes('avenida') ||
                            lowerPlaceName.includes('avenue') ||
                            lowerPlaceName.match(/\d{5}/); // Códigos postales
            
            // Penalizar calles cuando se busca "bellas artes"
            if (originalQueryLower.includes('bellas artes') && isStreet) {
              priorityScore -= 50; // Penalizar fuertemente calles cuando se busca "bellas artes"
            }
            
            const isPalacioBellasArtes = (lowerPlaceName.includes('palacio de bellas artes') ||
                                         (lowerPlaceName.includes('bellas artes') && 
                                          !isStreet &&
                                          (lowerPlaceName.includes('centro histórico') || 
                                           lowerPlaceName.includes('alameda') ||
                                           lowerPlaceName.includes('mexico city') ||
                                           lowerPlaceName.includes('cdmx')))) &&
                                        !lowerPlaceName.includes('metro') &&
                                        !lowerPlaceName.includes('estación') &&
                                        !lowerPlaceName.includes('estacion');
            
            if (isPalacioBellasArtes && originalQueryLower.includes('bellas artes')) {
              priorityScore += 40; // Máxima prioridad para el Palacio de Bellas Artes cuando se busca "Bellas Artes"
            } else if (isPalacioBellasArtes) {
              priorityScore += 25; // Alta prioridad para el Palacio en general
            }
            
            return {
              id: feature.id || `suggestion-${index}`,
              place_name: placeName,
              center: feature.center,
              priorityScore,
              relevance: feature.relevance || 0,
              placeType: placeTypes,
            };
          })
          // Ordenar por score de prioridad (mayor primero)
          .sort((a: any, b: any) => {
            // Primero por score de prioridad
            if (b.priorityScore !== a.priorityScore) {
              return b.priorityScore - a.priorityScore;
            }
            // Si tienen el mismo score, por relevancia
            return (b.relevance || 0) - (a.relevance || 0);
          })
          // Limitar a 8 resultados más relevantes
          .slice(0, 8)
          .map((item: any) => ({
            id: item.id,
            place_name: item.place_name,
            center: item.center,
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
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}>
                <Text style={styles.suggestionText}>{item.place_name}</Text>
              </TouchableOpacity>
            )}
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
    zIndex: 20,
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
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40, // Espacio para el indicador de carga
    fontSize: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    color: '#F8FAFC',
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
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    maxHeight: 320,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
    zIndex: 9999,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.18)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 18,
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

