import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {useNavigation} from '@react-navigation/native';
import {appLog} from '../utils/clientLogger';

export const MarketingSellSkatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [brandDetails, setBrandDetails] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  const categories = [
    'Fitness',
    'Freeskate',
    'Agresivos',
    'Velocidad',
    'Slalom / Freestyle',
  ];

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Regresar</Text>
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.title}>Inicio de Publicar venta</Text>
                <Text style={styles.subtitle}>Paso 1</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Marca y características del patín</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. FR1 80, aluminio, número 27, usado"
              placeholderTextColor="rgba(203, 213, 245, 0.7)"
              value={brandDetails}
              onChangeText={setBrandDetails}
              multiline
            />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categoría</Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowCategoryInfo(true)}>
                <Text style={styles.infoIcon}>ℹ️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Selecciona la categoría del patín:
            </Text>
            <View style={styles.categoryList}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryItem,
                    category === item && styles.categoryItemActive,
                  ]}
                  onPress={() => setCategory(item)}>
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextActive,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              if (!category) {
                appLog.warn('Publicar venta: falta categoría', {
                  screen: 'MarketingSellSkatesScreen',
                });
                Alert.alert('Marketing', 'Selecciona una categoría.');
                return;
              }
              appLog.info('Publicar venta paso 1 → paso 2', {
                screen: 'MarketingSellSkatesScreen',
                context: {category},
              });
              navigation.navigate('MarketingSellSkatesStep3', {category});
            }}>
            <Text style={styles.nextButtonText}>Siguiente</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Modal
        visible={showCategoryInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryInfo(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Categorías Principales de Patines en Línea
            </Text>
            <Text style={styles.modalText}>
              Fitness (Recreativos): Son los más comunes para principiantes.
              Tienen una bota blanda tipo tenis que prioriza la comodidad y
              ventilación para paseos cortos en superficies lisas.{'\n\n'}
              Freeskate (Urbanos): Diseñados para la ciudad. Cuentan con una
              bota rígida (hardboot) de plástico de alta resistencia que ofrece
              mayor soporte al tobillo, permitiendo saltos, derrapes y mayor
              control en baches.{'\n\n'}
              Agresivos: Ideales para parques de skate (skateparks). Tienen
              ruedas muy pequeñas y planas, bota reforzada y un espacio en el
              centro (H-block) para deslizarse sobre rieles o bordes.{'\n\n'}
              Velocidad: Enfocados en competencia. Se distinguen por su bota
              baja (por debajo del tobillo) de fibra de carbono y ruedas de gran
              tamaño (100mm a 125mm) para alcanzar altas velocidades.{'\n\n'}
              Slalom / Freestyle: Utilizados para realizar trucos y figuras
              entre conos. Suelen tener una bota de carbono muy ajustada y una
              configuración de ruedas "rockered" (las de los extremos son más
              pequeñas o el chasis las eleva) para máxima maniobrabilidad.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryInfo(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backButtonText: {
    fontSize: 11,
    color: '#CBD5F5',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  helperText: {
    fontSize: 12,
    color: '#CBD5F5',
    marginBottom: 10,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  categoryItemActive: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  categoryText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#7DD3FC',
  },
  nextButton: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  nextButtonText: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '700',
  },
  infoButton: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  infoIcon: {
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  modalText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  modalCloseText: {
    color: '#7DD3FC',
    fontWeight: '600',
  },
});
