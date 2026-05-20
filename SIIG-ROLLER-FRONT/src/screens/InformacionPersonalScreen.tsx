// Copyright (c) 2026 Salvador Ivan Ibarra Garcia. Todos los derechos reservados.
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {Input} from '../components/Input';
import {Button} from '../components/Button';
import authService from '../services/authService';
import {Usuario, Sexo, Nacionalidad} from '../types';
import {TouchableOpacity} from 'react-native';

interface InformacionPersonalScreenProps {
  navigation: any;
}

const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDDMMYYYY = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const date = new Date(year, month, day);
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }
  return date;
};

export const InformacionPersonalScreen: React.FC<InformacionPersonalScreenProps> = ({navigation}) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [fechaTexto, setFechaTexto] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    edad: 18,
    sexo: 'masculino' as Sexo,
    nacionalidad: 'español' as Nacionalidad,
    telefono: '',
  });
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setFormData({
          email: user.email,
          edad: user.edad,
          sexo: user.sexo,
          nacionalidad: user.nacionalidad,
          telefono: user.telefono || '',
        });
        if (user.cumpleaños) {
          const date =
            user.cumpleaños instanceof Date
              ? user.cumpleaños
              : new Date(user.cumpleaños);
          setFechaTexto(formatDateToDDMMYYYY(date));
        }
      }
    };
    loadUser();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (Platform.OS === 'android') {
      const ToastAndroid = require('react-native').ToastAndroid;
      ToastAndroid.show(message, ToastAndroid.SHORT);
      return;
    }
    setToast({message, type});
    setTimeout(() => setToast(null), 2200);
  };

  const handleSave = async () => {
    if (!fechaTexto || fechaTexto.length !== 10) {
      showToast('Ingresa la fecha en formato DD/MM/YYYY', 'error');
      return;
    }
    const parsed = parseDDMMYYYY(fechaTexto);
    if (!parsed) {
      showToast('Fecha inválida', 'error');
      return;
    }

    if (formData.edad < 13 || formData.edad > 120) {
      showToast('Edad inválida', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updatePersonalInfo({
        edad: formData.edad,
        cumpleaños: parsed.toISOString().split('T')[0],
        sexo: formData.sexo,
        nacionalidad: formData.nacionalidad,
        telefono: formData.telefono.trim() || null,
      });
      if (response.success) {
        if (response.usuario) {
          setCurrentUser(response.usuario);
        }
        showToast('Cambios guardados', 'success');
      } else {
        showToast(response.error || 'No se pudo guardar los cambios', 'error');
      }
    } catch (error) {
      showToast('No se pudo guardar los cambios', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {toast && (
            <View
              style={[
                styles.toastContainer,
                toast.type === 'success' ? styles.toastSuccess : styles.toastError,
              ]}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          )}
          <Text style={styles.title}>Información personal</Text>
          <Text style={styles.subtitle}>
            Actualiza tus datos básicos
          </Text>

          <Input
            label="Email"
            value={formData.email}
            editable={false}
          />

          <Input
            label="Edad"
            placeholder="18"
            value={formData.edad.toString()}
            onChangeText={text => setFormData(prev => ({...prev, edad: parseInt(text, 10) || 0}))}
            keyboardType="number-pad"
          />

          <Input
            label="Fecha de cumpleaños"
            placeholder="DD/MM/YYYY"
            value={fechaTexto}
            onChangeText={text => {
              let cleaned = text.replace(/[^\d/]/g, '');
              let formatted = cleaned;
              if (cleaned.length > 2 && cleaned[2] !== '/') {
                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
              }
              if (formatted.length > 5 && formatted[5] !== '/') {
                formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
              }
              if (formatted.length > 10) {
                formatted = formatted.slice(0, 10);
              }
              setFechaTexto(formatted);
            }}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Sexo</Text>
          <View style={styles.buttonRow}>
            {(['masculino', 'femenino', 'ambos'] as Sexo[]).map(sexo => (
              <TouchableOpacity
                key={sexo}
                style={[
                  styles.choiceButton,
                  formData.sexo === sexo && styles.choiceButtonActive,
                ]}
                onPress={() => setFormData(prev => ({...prev, sexo}))}>
                <Text
                  style={[
                    styles.choiceButtonText,
                    formData.sexo === sexo && styles.choiceButtonTextActive,
                  ]}>
                  {sexo === 'ambos' ? 'Prefiero no decirlo' : sexo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nacionalidad</Text>
          <View style={styles.buttonRow}>
            {(['español', 'inglés'] as Nacionalidad[]).map(nacionalidad => (
              <TouchableOpacity
                key={nacionalidad}
                style={[
                  styles.choiceButton,
                  formData.nacionalidad === nacionalidad && styles.choiceButtonActive,
                ]}
                onPress={() => setFormData(prev => ({...prev, nacionalidad}))}>
                <Text
                  style={[
                    styles.choiceButtonText,
                    formData.nacionalidad === nacionalidad && styles.choiceButtonTextActive,
                  ]}>
                  {nacionalidad}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Número telefónico"
            placeholder="Ej: 5512345678"
            value={formData.telefono}
            onChangeText={text => setFormData(prev => ({...prev, telefono: text}))}
            keyboardType="phone-pad"
          />

          <Button
            title="Guardar cambios"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          <Text style={styles.backLink} onPress={() => navigation.goBack()}>
            Volver
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  choiceButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  choiceButtonText: {
    color: '#666',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  choiceButtonTextActive: {
    color: '#007AFF',
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 14,
  },
  toastContainer: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toastSuccess: {
    backgroundColor: '#2ECC71',
  },
  toastError: {
    backgroundColor: '#FF3B30',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 14,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
  },
});
