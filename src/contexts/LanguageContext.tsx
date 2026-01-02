import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  es: {
    // Pantalla de Login
    'login.title': 'Iniciar Sesión',
    'login.subtitle': 'Bienvenido de vuelta',
    'login.email': 'Email',
    'login.password': 'Contraseña',
    'login.button': 'Iniciar Sesión',
    'login.register': '¿No tienes una cuenta?',
    'login.registerLink': 'Regístrate aquí',
    // Pantalla de Registro
    'register.title': 'Crear Cuenta',
    'register.subtitle': 'Únete a la comunidad roller',
    'register.email': 'Email',
    'register.password': 'Contraseña',
    'register.confirmPassword': 'Confirmar Contraseña',
    'register.age': 'Edad',
    'register.birthday': 'Fecha de Cumpleaños',
    'register.gender': 'Sexo',
    'register.language': 'Idioma',
    'register.profile': 'Tipo de Perfil',
    'register.avatar': 'Avatar (Opcional)',
    'register.create': 'Crear Cuenta',
    'register.login': '¿Ya tienes una cuenta?',
    'register.loginLink': 'Inicia sesión',
    'register.selectAvatar': 'Seleccionar Avatar',
    'register.changeAvatar': 'Cambiar Avatar',
    'register.alias': 'Alias (Opcional)',
    'register.saveAlias': 'Guardar Alias',
    'register.aliasRequired': 'El alias es requerido',
    'register.aliasMaxLength': 'El alias no puede exceder 100 caracteres',
    'register.aliasInvalid': 'El alias solo puede contener letras, números, espacios, guiones y guiones bajos',
    'register.aliasValid': '✓ Alias válido (se guardará después del registro)',
    'register.aliasError': 'Error al validar alias',
    'register.gender.masculino': 'Masculino',
    'register.gender.femenino': 'Femenino',
    'register.gender.ambos': 'Ambos',
    'register.language.espanol': 'Español',
    'register.language.ingles': 'English',
    'register.profile.liderGrupo': 'Líder de Grupo',
    'register.profile.roller': 'Roller',
    'register.success': 'Cuenta creada exitosamente',
    'register.welcome': 'Bienvenido a la aventura Roller',
    'register.welcomeButton': 'OK',
    // Menú
    'menu.title': 'Menú',
    'menu.subtitle': 'Configuración y opciones de la aplicación',
    'menu.addAlias': 'Agregar Alias',
    'menu.changeAlias': 'Cambiar de Alias',
    'menu.addStaff': 'Agregar Staff',
    'menu.groupName': 'Nombre del Grupo',
    'menu.members': 'Integrantes del Grupo',
    'menu.logout': 'Cerrar Sesión',
    'menu.addAvatar': 'Agregar Avatar',
    'menu.modifyAvatar': 'Modificar Avatar',
    // Navegación
    'navigation.title': 'Inicio de Recorrido',
    'navigation.subtitle': 'Navegación y Tracking',
    'navigation.origin': 'Origen',
    'navigation.destination': 'Destino',
    'navigation.calculate': 'Calcular Ruta',
    // Comunidad
    'community.title': 'Comunidad',
    'community.subtitle': 'Conecta con otros rollers',
    'community.chatGeneral': 'Chat General',
    'community.chatStaff': 'Chat Staff',
    // Historial
    'history.title': 'Historial',
    'history.subtitle': 'Tus recorridos anteriores',
    // Calendario
    'calendar.title': 'Calendario',
    'calendar.subtitle': 'Eventos y rodadas programadas',
    'calendar.newEvent': 'Nuevo Evento',
    'calendar.register': 'Registrarse Ahora',
    'calendar.noEvents': 'No hay eventos programados',
    // Crear Evento
    'createEvent.title': 'Crear Nuevo Evento',
    'createEvent.eventTitle': 'Título del Evento',
    'createEvent.description': 'Descripción',
    'createEvent.date': 'Fecha',
    'createEvent.time': 'Hora',
    'createEvent.location': 'Ubicación',
    'createEvent.create': 'Crear Evento',
  },
  en: {
    // Login Screen
    'login.title': 'Login',
    'login.subtitle': 'Welcome back',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.button': 'Sign In',
    'login.register': "Don't have an account?",
    'login.registerLink': 'Register here',
    // Register Screen
    'register.title': 'Create Account',
    'register.subtitle': 'Join the roller community',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.age': 'Age',
    'register.birthday': 'Birthday',
    'register.gender': 'Gender',
    'register.language': 'Language',
    'register.profile': 'Profile Type',
    'register.avatar': 'Avatar (Optional)',
    'register.create': 'Create Account',
    'register.login': 'Already have an account?',
    'register.loginLink': 'Sign in',
    'register.selectAvatar': 'Select Avatar',
    'register.changeAvatar': 'Change Avatar',
    'register.alias': 'Alias (Optional)',
    'register.saveAlias': 'Save Alias',
    'register.aliasRequired': 'Alias is required',
    'register.aliasMaxLength': 'Alias cannot exceed 100 characters',
    'register.aliasInvalid': 'Alias can only contain letters, numbers, spaces, hyphens and underscores',
    'register.aliasValid': '✓ Valid alias (will be saved after registration)',
    'register.aliasError': 'Error validating alias',
    'register.gender.masculino': 'Male',
    'register.gender.femenino': 'Female',
    'register.gender.ambos': 'Both',
    'register.language.espanol': 'Spanish',
    'register.language.ingles': 'English',
    'register.profile.liderGrupo': 'Group Leader',
    'register.profile.roller': 'Roller',
    'register.success': 'Account created successfully',
    'register.welcome': 'Welcome to the Roller adventure',
    'register.welcomeButton': 'OK',
    // Menu
    'menu.title': 'Menu',
    'menu.subtitle': 'Application settings and options',
    'menu.addAlias': 'Add Alias',
    'menu.changeAlias': 'Change Alias',
    'menu.addStaff': 'Add Staff',
    'menu.groupName': 'Group Name',
    'menu.members': 'Group Members',
    'menu.logout': 'Logout',
    'menu.addAvatar': 'Add Avatar',
    'menu.modifyAvatar': 'Modify Avatar',
    // Navigation
    'navigation.title': 'Start Route',
    'navigation.subtitle': 'Navigation and Tracking',
    'navigation.origin': 'Origin',
    'navigation.destination': 'Destination',
    'navigation.calculate': 'Calculate Route',
    // Community
    'community.title': 'Community',
    'community.subtitle': 'Connect with other rollers',
    'community.chatGeneral': 'General Chat',
    'community.chatStaff': 'Staff Chat',
    // History
    'history.title': 'History',
    'history.subtitle': 'Your previous routes',
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.subtitle': 'Scheduled events and rides',
    'calendar.newEvent': 'New Event',
    'calendar.register': 'Register Now',
    'calendar.noEvents': 'No scheduled events',
    // Create Event
    'createEvent.title': 'Create New Event',
    'createEvent.eventTitle': 'Event Title',
    'createEvent.description': 'Description',
    'createEvent.date': 'Date',
    'createEvent.time': 'Time',
    'createEvent.location': 'Location',
    'createEvent.create': 'Create Event',
  },
};

const LANGUAGE_STORAGE_KEY = '@app:language';

export const LanguageProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage === 'en' || savedLanguage === 'es') {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.es] || key;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

