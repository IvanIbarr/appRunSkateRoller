import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {AvatarSelector} from '../components/AvatarSelector';
import {AvatarCircle} from '../components/AvatarCircle';
import {WelcomeModal} from '../components/WelcomeModal';
import authService from '../services/authService';
import aliasService from '../services/aliasService';
import {useLanguage} from '../contexts/LanguageContext';
import {RegistroData, Sexo, Nacionalidad, TipoPerfil} from '../types';

// Función para convertir de Date a formato dd/mm/yyyy
const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Función para convertir de dd/mm/yyyy a Date
const parseDDMMYYYY = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Los meses en Date son 0-indexados
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month, day);
  // Validar que la fecha sea válida
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }
  
  return date;
};

interface RegistroScreenProps {
  navigation: any;
}

export const RegistroScreen: React.FC<RegistroScreenProps> = ({
  navigation,
}) => {
  const {setLanguage, t} = useLanguage();
  const [formData, setFormData] = useState<RegistroData>({
    email: '',
    password: '',
    confirmPassword: '',
    edad: 18,
    cumpleaños: new Date(),
    sexo: 'masculino',
    nacionalidad: 'español',
    tipoPerfil: 'roller',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistroData>>({});
  const [avatarSelectorVisible, setAvatarSelectorVisible] = useState(false);
  const [alias, setAlias] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [aliasSuccess, setAliasSuccess] = useState('');
  const [aliasLoading, setAliasLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [fechaTexto, setFechaTexto] = useState<string>(
    formData.cumpleaños
      ? formatDateToDDMMYYYY(
          formData.cumpleaños instanceof Date
            ? formData.cumpleaños
            : new Date(formData.cumpleaños),
        )
      : '',
  );

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.edad || formData.edad < 13) {
      newErrors.edad = 'Debes tener al menos 13 años';
    } else if (formData.edad > 120) {
      newErrors.edad = 'Ingresa una edad válida';
    }

    // Validar fecha de cumpleaños
    if (!fechaTexto || fechaTexto.trim() === '') {
      newErrors.cumpleaños = 'La fecha de cumpleaños es requerida';
    } else if (fechaTexto.length !== 10) {
      newErrors.cumpleaños = 'Ingresa la fecha en formato DD/MM/YYYY';
    } else {
      const parsedDate = parseDDMMYYYY(fechaTexto);
      if (!parsedDate) {
        newErrors.cumpleaños = 'Fecha inválida. Ingresa una fecha válida';
      } else {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaComparar = new Date(parsedDate);
        fechaComparar.setHours(0, 0, 0, 0);
        
        if (fechaComparar > hoy) {
          newErrors.cumpleaños = 'La fecha no puede ser futura';
        } else {
          // Calcular la edad real basada en la fecha de cumpleaños
          let edadCalculada =
            hoy.getFullYear() - fechaComparar.getFullYear();
          
          // Ajustar si aún no ha cumplido años este año
          const mesActual = hoy.getMonth();
          const diaActual = hoy.getDate();
          const mesCumple = fechaComparar.getMonth();
          const diaCumple = fechaComparar.getDate();
          
          if (mesActual < mesCumple || (mesActual === mesCumple && diaActual < diaCumple)) {
            edadCalculada--;
          }
          
          // Validar que la edad ingresada coincida exactamente con la edad calculada
          if (formData.edad !== edadCalculada) {
            newErrors.edad = `La edad no coincide con la fecha de cumpleaños. Según la fecha ingresada (${fechaTexto}), deberías tener ${edadCalculada} años, pero ingresaste ${formData.edad} años`;
            newErrors.cumpleaños = `La fecha de cumpleaños indica que tienes ${edadCalculada} años, pero ingresaste ${formData.edad} años. Por favor, corrige la fecha o la edad para que coincidan.`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardarAlias = () => {
    setAliasError('');
    setAliasSuccess('');

    if (!alias.trim()) {
      setAliasError(t('register.aliasRequired'));
      return;
    }

    if (alias.trim().length > 100) {
      setAliasError(t('register.aliasMaxLength'));
      return;
    }

    const aliasRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/;
    if (!aliasRegex.test(alias.trim())) {
      setAliasError(t('register.aliasInvalid'));
      return;
    }

    // Solo validamos, el alias se guardará después del registro exitoso
    setAliasSuccess(t('register.aliasValid'));
  };

  const handleRegistro = async () => {
    // Validar formulario
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Cambiar idioma según la selección
      if (formData.nacionalidad === 'inglés') {
        await setLanguage('en');
      } else {
        await setLanguage('es');
      }

      const response = await authService.registro(formData);

      if (response.success && response.usuario) {
        // Si hay alias ingresado, guardarlo después del registro
        if (alias.trim()) {
          try {
            const aliasResponse = await aliasService.agregarAlias(alias.trim());
            if (!aliasResponse.success) {
              console.warn('No se pudo guardar el alias:', aliasResponse.error);
              // No bloqueamos el registro si falla el alias
            }
          } catch (aliasError) {
            console.error('Error al guardar alias:', aliasError);
            // No bloqueamos el registro si falla el alias
          }
        }
        
        // Mostrar modal de bienvenida
        setShowWelcomeModal(true);
      } else {
        // Mostrar error
        const errorMessage = response.error || 'Error al registrar usuario';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('register.title')}</Text>
            <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
          </View>

          {/* Formulario con fondo semitransparente */}
          <View style={styles.form}>
            <View style={styles.formCard}>
              <Input
                label={t('register.email')}
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChangeText={text => setFormData({...formData, email: text})}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

            {/* Campo de Alias */}
            <View style={styles.aliasSection}>
              <Input
                label={t('register.alias')}
                placeholder="Ej: RollerPro2024"
                value={alias}
                onChangeText={text => {
                  setAlias(text);
                  setAliasError('');
                  setAliasSuccess('');
                }}
                error={aliasError}
                maxLength={100}
              />
              {alias && (
                <Button
                  title={t('register.saveAlias')}
                  onPress={handleGuardarAlias}
                  variant="outline"
                  style={styles.saveAliasButton}
                />
              )}
              {aliasSuccess ? (
                <Text style={styles.aliasSuccessText}>{aliasSuccess}</Text>
              ) : null}
            </View>

            <Input
              label={t('register.password')}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChangeText={text => setFormData({...formData, password: text})}
              error={errors.password}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
            />

            <Input
              label={t('register.confirmPassword')}
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChangeText={text =>
                setFormData({...formData, confirmPassword: text})
              }
              error={errors.confirmPassword}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
            />

            <Input
              label={t('register.age')}
              placeholder="18"
              value={formData.edad.toString()}
              onChangeText={text => {
                const edad = parseInt(text, 10) || 0;
                setFormData(prev => ({...prev, edad}));
                
                // Validar edad vs fecha cuando cambia la edad
                if (fechaTexto && fechaTexto.length === 10) {
                  const parsedDate = parseDDMMYYYY(fechaTexto);
                  if (parsedDate) {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const fechaComparar = new Date(parsedDate);
                    fechaComparar.setHours(0, 0, 0, 0);
                    
                    if (fechaComparar <= hoy && edad > 0) {
                      let edadCalculada =
                        hoy.getFullYear() - fechaComparar.getFullYear();
                      
                      const mesActual = hoy.getMonth();
                      const diaActual = hoy.getDate();
                      const mesCumple = fechaComparar.getMonth();
                      const diaCumple = fechaComparar.getDate();
                      
                      if (mesActual < mesCumple || (mesActual === mesCumple && diaActual < diaCumple)) {
                        edadCalculada--;
                      }
                      
                      // Si la edad no coincide, mostrar error
                      if (edad !== edadCalculada) {
                        const newErrors = {...errors};
                        newErrors.edad = `La edad no coincide con la fecha de cumpleaños. Según la fecha, deberías tener ${edadCalculada} años`;
                        newErrors.cumpleaños = `La fecha indica que tienes ${edadCalculada} años, pero ingresaste ${edad} años`;
                        setErrors(newErrors);
                      } else {
                        // Limpiar errores si coinciden
                        const newErrors = {...errors};
                        if (newErrors.edad && newErrors.edad.includes('no coincide')) {
                          delete newErrors.edad;
                        }
                        if (newErrors.cumpleaños && newErrors.cumpleaños.includes('indica que tienes')) {
                          delete newErrors.cumpleaños;
                        }
                        setErrors(newErrors);
                      }
                    }
                  }
                }
              }}
              error={errors.edad}
              keyboardType="number-pad"
            />

            {/* Fecha de Cumpleaños */}
            <Input
              label={t('register.birthday')}
              placeholder="DD/MM/YYYY (ej: 15/01/1990)"
              value={fechaTexto}
              onChangeText={text => {
                // Permitir solo números y barras
                let cleaned = text.replace(/[^\d/]/g, '');
                
                // Formatear automáticamente mientras el usuario escribe
                let formatted = cleaned;
                if (cleaned.length > 2 && cleaned[2] !== '/') {
                  formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                }
                if (formatted.length > 5 && formatted[5] !== '/') {
                  formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
                }
                // Limitar a 10 caracteres (DD/MM/YYYY)
                if (formatted.length > 10) {
                  formatted = formatted.slice(0, 10);
                }

                setFechaTexto(formatted);

                // Si el formato es válido (10 caracteres), intentar parsear
                if (formatted.length === 10) {
                  const parsedDate = parseDDMMYYYY(formatted);
                  if (parsedDate) {
                    setFormData({
                      ...formData,
                      cumpleaños: parsedDate,
                    });
                    // Limpiar error si existe
                    if (errors.cumpleaños) {
                      const newErrors = {...errors};
                      delete newErrors.cumpleaños;
                      setErrors(newErrors);
                    }
                  }
                }
              }}
              error={errors.cumpleaños}
              keyboardType="numeric"
            />

            {/* Sexo */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>{t('register.gender')}</Text>
              <View style={styles.sexoButtons}>
                {(['masculino', 'femenino', 'ambos'] as Sexo[]).map(sexo => (
                  <TouchableOpacity
                    key={sexo}
                    style={[
                      styles.sexoButton,
                      formData.sexo === sexo && styles.sexoButtonActive,
                    ]}
                    onPress={() => setFormData({...formData, sexo})}>
                    <Text
                      style={[
                        styles.sexoButtonText,
                        formData.sexo === sexo && styles.sexoButtonTextActive,
                      ]}>
                      {t(`register.gender.${sexo}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Idioma */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>{t('register.language')}</Text>
              <View style={styles.nacionalidadButtons}>
                {(['español', 'inglés'] as Nacionalidad[]).map(nacionalidad => (
                  <TouchableOpacity
                    key={nacionalidad}
                    style={[
                      styles.nacionalidadButton,
                      formData.nacionalidad === nacionalidad &&
                        styles.nacionalidadButtonActive,
                    ]}
                    onPress={async () => {
                      setFormData({...formData, nacionalidad});
                      // Cambiar idioma inmediatamente cuando se selecciona
                      if (nacionalidad === 'inglés') {
                        await setLanguage('en');
                      } else {
                        await setLanguage('es');
                      }
                    }}>
                    <Text
                      style={[
                        styles.nacionalidadButtonText,
                        formData.nacionalidad === nacionalidad &&
                          styles.nacionalidadButtonTextActive,
                      ]}>
                      {nacionalidad === 'español' ? t('register.language.espanol') : t('register.language.ingles')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tipo de Perfil */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>{t('register.profile')}</Text>
              <View style={styles.perfilButtons}>
                {(['liderGrupo', 'roller'] as TipoPerfil[]).map(perfil => (
                  <TouchableOpacity
                    key={perfil}
                    style={[
                      styles.perfilButton,
                      formData.tipoPerfil === perfil &&
                        styles.perfilButtonActive,
                    ]}
                    onPress={() => setFormData({...formData, tipoPerfil: perfil})}>
                    <Text
                      style={[
                        styles.perfilButtonText,
                        formData.tipoPerfil === perfil &&
                          styles.perfilButtonTextActive,
                      ]}>
                      {t(`register.profile.${perfil}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selección de Avatar */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>{t('register.avatar')}</Text>
              <TouchableOpacity
                style={styles.avatarSelectorButton}
                onPress={() => setAvatarSelectorVisible(true)}>
                <View style={styles.avatarSelectorContent}>
                  <AvatarCircle avatar={formData.avatar} size={50} />
                  <Text style={styles.avatarSelectorText}>
                    {formData.avatar ? t('register.changeAvatar') : t('register.selectAvatar')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

              <Button
                title={t('register.create')}
                onPress={handleRegistro}
                loading={loading}
                style={styles.registroButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('register.login')} </Text>
                <Text
                  style={styles.loginLink}
                  onPress={() => navigation.goBack()}>
                  {t('register.loginLink')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Selección de Avatar */}
      <AvatarSelector
        visible={avatarSelectorVisible}
        onClose={() => setAvatarSelectorVisible(false)}
        onSelectAvatar={(avatar) => {
          setFormData({...formData, avatar});
          setAvatarSelectorVisible(false);
        }}
        selectedAvatar={formData.avatar || null}
      />

      {/* Modal de Bienvenida */}
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          // Navegar a pantalla de navegación después de cerrar el modal
          navigation.reset({
            index: 0,
            routes: [{name: 'Navegacion'}],
          });
        }}
        message={t('register.welcome')}
        buttonText={t('register.welcomeButton')}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
    width: '100%',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sexoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sexoButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sexoButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  sexoButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sexoButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  nacionalidadButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  nacionalidadButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nacionalidadButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  nacionalidadButtonText: {
    fontSize: 14,
    color: '#666',
  },
  nacionalidadButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  perfilButtons: {
    gap: 8,
  },
  perfilButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  perfilButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  perfilButtonText: {
    fontSize: 14,
    color: '#666',
  },
  perfilButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registroButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  dateInputContainer: {
    width: '100%',
  },
  dateInputWeb: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
    minHeight: 48,
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    minHeight: 48,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dateButtonPlaceholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  avatarSelectorButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    minHeight: 48,
  },
  avatarSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  aliasSection: {
    marginBottom: 16,
  },
  saveAliasButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  aliasSuccessText: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '600',
  },
});

