import React, {useState, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [longitud, latitud]
}

type AreaScope = 'near' | 'state' | 'country';

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
  /** Oculta sugerencias (p. ej. cuando otro campo tiene foco; evita capas que bloquean toques en Safari). */
  suppressSuggestions?: boolean;
  onFocusInput?: () => void;
  onBlurInput?: () => void;
  /**
   * En web, actualizar el estado del padre en cada tecla puede provocar pérdida de foco y "parpadeo"
   * (especialmente con mapas/ScrollView). Si true, este input mantiene un valor interno y solo
   * confirma el texto al seleccionar una sugerencia o al salir del campo.
   */
  deferParentUpdates?: boolean;
  /** Proximity para mejorar relevancia (formato "lng,lat"). */
  proximity?: string;
  /** Idioma para sugerencias (default: 'es'). */
  language?: string;
  /**
   * Para búsquedas por categoría (chips), Mapbox no expone un "radio" explícito en Geocoding v5.
   * Lo más cercano es limitar resultados con `bbox` alrededor del GPS (km aproximados).
   */
  categorySearchRadiusKm?: number;
  /** Contexto (estado/municipio) detectado por GPS (reverse geocode). */
  geoContext?: {estado?: string; municipio?: string} | null;
}

/** Fase 1: sin chips de categoría (metro/parque/museo); la búsqueda es por texto + ámbito (Cerca / estado / México). */
const PLACE_CATEGORIES: Array<{id: string; label: string; query: string}> = [];

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
  suppressSuggestions = false,
  onFocusInput,
  onBlurInput,
  deferParentUpdates = false,
  proximity,
  language = 'es',
  categorySearchRadiusKm,
  geoContext,
}) => {
  const AREA_SCOPE_STORAGE_KEY = 'roller:places:areaScope';
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [areaScope, setAreaScope] = useState<AreaScope>('near');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  /** Safari móvil / Chrome: el teclado encoge visualViewport; limitamos la lista para que haga scroll dentro del hueco visible. */
  const [visualViewportHeight, setVisualViewportHeight] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return Dimensions.get('window').height;
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) {
      return;
    }
    const vv = window.visualViewport;
    const onVv = () => setVisualViewportHeight(vv.height);
    vv.addEventListener('resize', onVv);
    vv.addEventListener('scroll', onVv);
    onVv();
    return () => {
      vv.removeEventListener('resize', onVv);
      vv.removeEventListener('scroll', onVv);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const suggestionsMaxHeight = React.useMemo(() => {
    if (Platform.OS === 'web') {
      const h = visualViewportHeight;
      return Math.max(120, Math.min(280, Math.floor(h * 0.36)));
    }
    const winH = Dimensions.get('window').height;
    if (keyboardHeight > 0) {
      const room = winH - keyboardHeight - 168;
      return Math.max(120, Math.min(300, room));
    }
    return 300;
  }, [visualViewportHeight, keyboardHeight]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(AREA_SCOPE_STORAGE_KEY);
        if (raw === 'near' || raw === 'state' || raw === 'country') {
          setAreaScope(raw);
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, []);

  const persistAreaScope = async (next: AreaScope) => {
    setAreaScope(next);
    try {
      await AsyncStorage.setItem(AREA_SCOPE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Si el padre actualiza el valor (por ejemplo al seleccionar sugerencia desde fuera),
    // sincronizamos el draft cuando no estamos editando activamente.
    if (!isFocused) {
      setDraftValue(value);
    }
  }, [value, isFocused]);

  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const effectiveValue = deferParentUpdates ? draftValue : value;

    // Si el valor coincide con una sugerencia seleccionada y el campo no está enfocado, no mostrar sugerencias
    if (selectedSuggestion && effectiveValue === selectedSuggestion && !isFocused) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Si el valor está vacío o tiene menos de 2 caracteres, no buscar
    if (!effectiveValue || effectiveValue.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestion(null); // Reset si el usuario borra todo
      return;
    }

    // Solo buscar si el campo está enfocado o si el valor cambió (usuario está escribiendo)
    if (!isFocused && effectiveValue === selectedSuggestion) {
      setShowSuggestions(false);
      return;
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    timeoutRef.current = setTimeout(() => {
      if (isFocused) {
        setLoading(true);
        fetchSuggestions(effectiveValue.trim(), activeCategory ?? undefined);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, draftValue, deferParentUpdates, isFocused, selectedSuggestion]);

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

  useEffect(() => {
    if (suppressSuggestions) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [suppressSuggestions]);

  const fetchSuggestions = async (query: string, category?: string) => {
    try {
      setHintText(null);
      // Verificar que el token esté disponible
      if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === '') {
        console.warn('AutocompleteInput: Mapbox token no configurado');
        setHintText('Búsqueda no disponible (falta token de Mapbox).');
        setLoading(false);
        return;
      }

      // Verificar si es el token de ejemplo
      if (isExampleToken()) {
        console.warn(
          'AutocompleteInput: Se está usando el token de ejemplo de Mapbox, que no permite usar las APIs. Por favor, configura tu propio token.',
        );
        setHintText('Búsqueda no disponible (token de ejemplo).');
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      // Construcción de búsqueda GLOBAL:
      // - No forzamos "CDMX" ni restringimos por país.
      // - Si tenemos GPS (proximity), Mapbox prioriza resultados cercanos como Google/Uber.
      let searchQuery = query.trim();
      
      // Tipos estilo Uber/Google:
      // - Acepta lo que el usuario escriba (POI, colonia/barrio, ciudad, estado, país, calle, CP).
      // - Si viene de un botón de categoría, sesgamos hacia POIs (no calles).
      const isCategoryPoi =
        category === 'metro' || category === 'parque' || category === 'skatepark' || category === 'museo';

      const types = isCategoryPoi
        ? 'poi,poi.landmark,poi.attraction'
        : 'poi,poi.landmark,poi.attraction,address,postcode,neighborhood,locality,place,region,country';

      const buildCategoryQuery = (base: string, cat?: string): string => {
        const estado = (geoContext?.estado || '').trim();
        const municipio = (geoContext?.municipio || '').trim();
        const loc = municipio || estado;
        if (!isCategoryPoi || !cat) {
          return base;
        }
        if (areaScope === 'country') {
          // México como contexto amplio (sin amarrar a un estado).
          return `${base}, México`;
        }
        if (areaScope === 'state' && loc) {
          return `${base}, ${loc}, México`;
        }
        return base;
      };
      // Si hay categoría, la usamos como "sesgo" sin reemplazar lo que escribió el usuario.
      const catPrefix = category
        ? PLACE_CATEGORIES.find((c) => c.id === category)?.query?.trim()
        : null;
      if (isCategoryPoi && catPrefix && searchQuery.length > 0) {
        const lower = searchQuery.toLowerCase();
        const lowerPrefix = catPrefix.toLowerCase();
        if (!lower.includes(lowerPrefix) && !lower.includes(category)) {
          searchQuery = `${catPrefix} ${searchQuery}`.trim();
        }
      }
      searchQuery = buildCategoryQuery(searchQuery, category);

      const parseProximityLngLat = (raw?: string): {lng: number; lat: number} | null => {
        if (!raw) {
          return null;
        }
        const parts = String(raw)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length < 2) {
          return null;
        }
        const lng = Number(parts[0]);
        const lat = Number(parts[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return null;
        }
        return {lng, lat};
      };

      const buildApproxBBoxKm = (
        center: {lng: number; lat: number},
        radiusKm: number,
      ): string | null => {
        if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
          return null;
        }
        // Aproximación suficiente para UI (no es geodesia exacta).
        const latDelta = radiusKm / 111.32;
        const cosLat = Math.cos((center.lat * Math.PI) / 180);
        const safeCos = Math.min(1, Math.max(0.2, Math.abs(cosLat)));
        const lngDelta = radiusKm / (111.32 * safeCos);
        const minLon = center.lng - lngDelta;
        const maxLon = center.lng + lngDelta;
        const minLat = center.lat - latDelta;
        const maxLat = center.lat + latDelta;
        return `${minLon},${minLat},${maxLon},${maxLat}`;
      };

      const proximityCoord = parseProximityLngLat(proximity);
      const categoryRadiusKm =
        typeof categorySearchRadiusKm === 'number' && Number.isFinite(categorySearchRadiusKm)
          ? categorySearchRadiusKm
          : null;
      const bboxForCategory =
        areaScope === 'near' &&
        isCategoryPoi &&
        proximityCoord &&
        categoryRadiusKm &&
        categoryRadiusKm > 0
          ? buildApproxBBoxKm(proximityCoord, categoryRadiusKm)
          : null;
      
      // RN (Android/iOS) no siempre expone URLSearchParams igual que web.
      // Construimos querystring manual para máxima compatibilidad.
      const qp: string[] = [
        `access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`,
        `limit=10`,
        `language=${encodeURIComponent(language)}`,
        `types=${encodeURIComponent(types)}`,
        `autocomplete=true`,
        `fuzzyMatch=true`,
        `routing=true`,
      ];
      if (areaScope === 'country') {
        qp.push(`country=${encodeURIComponent('mx')}`);
      }
      // Para chips de categoría, preferimos bbox (radio aproximado) en vez de solo proximity.
      if (bboxForCategory) {
        qp.push(`bbox=${encodeURIComponent(bboxForCategory)}`);
      } else if (proximity && proximity.trim().length > 0) {
        qp.push(`proximity=${encodeURIComponent(proximity.trim())}`);
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?${qp.join('&')}`,
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.error(
            'AutocompleteInput: Token de Mapbox inválido o sin permisos. Por favor, configura tu propio token en .env o en src/config/mapbox.ts',
          );
          setHintText('Búsqueda bloqueada (token Mapbox sin permisos para este dominio).');
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
        setHintText('No se pudo buscar (Mapbox devolvió error).');
        setSuggestions([]);
        setShowSuggestions(false);
        setLoading(false);
        return;
      }

      if (data.features && data.features.length > 0) {
        // Priorización GLOBAL: favorece POI/landmarks y coincidencia con query.
        const formattedSuggestions: Suggestion[] = data.features
          .map((feature: any, index: number) => {
            const placeName = feature.place_name || '';
            const lowerPlaceName = placeName.toLowerCase();
            
            // Calcular score de prioridad
            let priorityScore = feature.relevance || 0;
            
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
                                          !isStreet)) &&
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
        setHintText('Sin resultados. Prueba con menos palabras o sin calle/número.');
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      setHintText('No se pudo buscar (revisa tu conexión).');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setDraftValue(suggestion.place_name);
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
    if (deferParentUpdates) {
      setDraftValue(text);
      // Si el usuario borra todo, sí confirmamos al padre para limpiar estado dependiente.
      if (text.trim().length === 0) {
        onChangeText('');
      }
    } else {
      onChangeText(text);
    }
    // Si el usuario está editando, resetear la sugerencia seleccionada
    if (selectedSuggestion && text !== selectedSuggestion) {
      setSelectedSuggestion(null);
    }
    // UX móvil: arrancar sugerencias desde 2 caracteres
    if (isFocused && text.trim().length >= 2) {
      setShowSuggestions(true);
      setHintText(null);
    } else if (text.trim().length < 3) {
      setShowSuggestions(false);
    }
  };

  const handleCategoryPress = (category: typeof PLACE_CATEGORIES[0]) => {
    // La categoría funciona como filtro/sesgo: no reemplaza el texto del usuario.
    const nextCategory = activeCategory === category.id ? null : category.id;
    setActiveCategory(nextCategory);
    setSelectedSuggestion(null);
    setIsFocused(true);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    const currentText = (deferParentUpdates ? draftValue : value).trim();
    // Si el usuario ya escribió algo, buscamos ese texto con el sesgo de la categoría.
    // Si NO escribió nada, mostramos sugerencias "cerca" usando el query base de la categoría
    // (ej: "estación metro", "skatepark") con proximity/bbox para listar lugares cercanos sin teclear.
    const queryForFetch = currentText.length >= 2 ? currentText : category.query;
    setLoading(true);
    setShowSuggestions(true);
    setSuggestions([]);
    fetchSuggestions(queryForFetch, nextCategory ?? undefined);
  };

  const AreaScopeToggle: React.FC = () => {
    const chip = (key: AreaScope, label: string) => {
      const active = areaScope === key;
      return (
        <TouchableOpacity
          key={key}
          style={[styles.areaChip, active && styles.areaChipActive]}
          onPress={() => {
            void persistAreaScope(key);
            const currentText = (deferParentUpdates ? draftValue : value).trim();
            if (isFocused && currentText.length >= 2) {
              setLoading(true);
              fetchSuggestions(currentText, activeCategory ?? undefined);
            }
          }}
          activeOpacity={0.85}>
          <Text style={[styles.areaChipText, active && styles.areaChipTextActive]}>{label}</Text>
        </TouchableOpacity>
      );
    };
    return (
      <View style={styles.areaRow}>
        {chip('near', 'Cerca')}
        {chip('state', 'Mi estado')}
        {chip('country', 'México')}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        // En pantallas móviles, un zIndex alto permanente puede bloquear toques en inputs inferiores.
        // Solo elevamos cuando el input está activo / mostrando sugerencias.
        {zIndex: suppressSuggestions ? 1 : isFocused || showSuggestions ? 60 : 1},
        style,
      ]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      {showCategories && !suppressSuggestions && isFocused && (
        <View style={styles.categoriesContainer}>
          <AreaScopeToggle />
          {(!value || value.trim().length === 0) &&
            PLACE_CATEGORIES.map((category) => (
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
          ref={inputRef}
          style={[styles.input, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={deferParentUpdates ? draftValue : value}
          onChangeText={handleChangeText}
          // Desactivar autofill / barra del SO (llave, tarjeta, direcciones) lo máximo posible.
          // RN: autoComplete "off" + iOS textContentType none + Android noExcludeDescendants.
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          {...(Platform.OS === 'ios' ? {textContentType: 'none' as const} : {})}
          {...(Platform.OS === 'android'
            ? {
                importantForAutofill: 'noExcludeDescendants' as const,
                disableFullscreenUI: true,
              }
            : {})}
          onFocus={() => {
            setIsFocused(true);
            onFocusInput?.();
            // Si hay sugerencias y el valor no coincide con una seleccionada, mostrarlas
            if (suggestions.length > 0 && value !== selectedSuggestion) {
              setShowSuggestions(true);
              setHintText(null);
            } else if (value && value.trim().length >= 3 && value !== selectedSuggestion) {
              // Si hay texto pero no hay sugerencias cargadas, buscar
              setLoading(true);
              fetchSuggestions(value.trim(), activeCategory ?? undefined);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlurInput?.();
            // En modo "defer", confirmamos al salir para sincronizar con el padre sin romper el foco mientras escribe.
            if (deferParentUpdates) {
              const committed = draftValue;
              if (committed !== value) {
                onChangeText(committed);
              }
            }
            // Retrasar el cierre para permitir que el usuario haga clic en una sugerencia
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            blurTimeoutRef.current = setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
          }}
        />

        {(deferParentUpdates ? draftValue : value).trim().length > 0 && !loading && (
          <TouchableOpacity
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Borrar texto"
            onPress={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
              }
              setHintText(null);
              setSelectedSuggestion(null);
              setSuggestions([]);
              setShowSuggestions(false);
              setDraftValue('');
              onChangeText('');
              // Mantener foco para seguir escribiendo (tipo navegador/Google Maps).
              setIsFocused(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.85}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && hintText && isFocused && <Text style={styles.hintText}>{hintText}</Text>}

      {!suppressSuggestions && showSuggestions && (
        <View style={[styles.suggestionsContainer, {maxHeight: suggestionsMaxHeight}]}>
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              style={{maxHeight: suggestionsMaxHeight}}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}>
                  <Text style={styles.suggestionText}>{item.place_name}</Text>
                </TouchableOpacity>
              )}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator
              removeClippedSubviews={false}
            />
          ) : (
            <View style={styles.suggestionsEmpty}>
              <Text style={styles.suggestionsEmptyText}>
                {loading ? 'Buscando…' : hintText || 'Sin resultados.'}
              </Text>
            </View>
          )}
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
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
  },
  clearButtonText: {
    color: '#E2E8F0',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: -1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: 'rgba(226,232,240,0.88)',
    fontSize: 12,
    marginTop: 6,
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
    marginTop: 6,
    overflow: 'hidden',
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
  suggestionsEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionsEmptyText: {
    fontSize: 13,
    color: 'rgba(226,232,240,0.88)',
    lineHeight: 18,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    width: '100%',
  },
  areaRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  areaChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginRight: 8,
    marginBottom: 6,
  },
  areaChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E0F2FE',
  },
  areaChipTextActive: {
    color: '#020617',
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

