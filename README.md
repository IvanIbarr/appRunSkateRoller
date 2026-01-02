# SIIG-ROLLER-FRONT

Aplicación móvil React Native para la plataforma SIIG Roller - Capa de Presentación

## Descripción

Este proyecto contiene la capa de presentación de la aplicación SIIG Roller, desarrollada con React Native y TypeScript. Incluye el flujo completo de autenticación con inicio de sesión y registro de usuarios.

## Características

### Autenticación
- ✅ Inicio de sesión con email y contraseña
- ✅ Registro de nuevos usuarios con validación completa
- ✅ Tres tipos de perfiles: Administrador, Líder de Grupo y Roller
- ✅ Campos requeridos: edad, cumpleaños, sexo, correo, nacionalidad
- ✅ Integración con logo del perfil

### Stack Tecnológico
- **React Native** 0.73.2
- **TypeScript** para tipado estático
- **React Navigation** para navegación entre pantallas
- **AsyncStorage** para persistencia local
- **React Native Safe Area Context** para manejo de áreas seguras

## Estructura del Proyecto

```
SIIG-ROLLER-FRONT/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── screens/          # Pantallas de la aplicación
│   │   ├── LoginScreen.tsx
│   │   ├── RegistroScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── services/         # Servicios y lógica de negocio
│   │   └── authService.ts
│   ├── types/            # Definiciones de tipos TypeScript
│   │   └── index.ts
│   └── navigation/       # Configuración de navegación
│       └── AppNavigator.tsx
├── assets/               # Recursos estáticos (imágenes, etc.)
├── App.tsx              # Componente principal
└── package.json
```

## Instalación

1. Instalar dependencias:
```bash
npm install
# o
yarn install
```

2. Para iOS, instalar pods:
```bash
cd ios && pod install && cd ..
```

## Ejecución

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Usuarios Mock

El servicio de autenticación incluye usuarios de prueba:

- **Administrador**
  - Email: `admin@roller.com`
  - Contraseña: `admin123`

- **Líder de Grupo**
  - Email: `lider@roller.com`
  - Contraseña: `lider123`

- **Roller**
  - Email: `roller@roller.com`
  - Contraseña: `roller123`

## Flujo de Autenticación

1. **Login**: El usuario ingresa email y contraseña
2. **Validación**: Se valida que las credenciales sean correctas
3. **Autenticación**: Se genera un token mock y se guarda en AsyncStorage
4. **Navegación**: Se redirige a la pantalla Home según el tipo de perfil

## Registro de Usuarios

El formulario de registro incluye:
- Email (validación de formato)
- Contraseña (mínimo 6 caracteres)
- Confirmación de contraseña
- Edad (mínimo 13 años)
- Sexo (masculino, femenino, ambos)
- Nacionalidad (español, inglés)
- Tipo de perfil (administrador, liderGrupo, roller)

## Próximos Pasos

- [ ] Integración con backend real (API REST)
- [ ] Autenticación con Firebase
- [ ] Mejora de UI/UX con diseño moderno
- [ ] Validación de fecha de cumpleaños
- [ ] Selección de logo desde galería
- [ ] Recuperación de contraseña
- [ ] Modo oscuro

## Requisitos

- Node.js >= 18
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

## Licencia

Proyecto privado - SIIG Roller

