import 'package:flutter/material.dart';

import '../core/ui/preview.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/admin/presentation/admin_home_screen.dart';

@Preview('Auth · Registro REAL (iPhone + Desktop)')
Widget previewRegisterRealCompare() => previewCompare(
      title: 'Registro (real)',
      iphone: const RegisterScreen(),
      desktop: const RegisterScreen(),
    );

@Preview('Admin · Home REAL (iPhone + Desktop)')
Widget previewAdminHomeRealCompare() => previewCompare(
      title: 'Admin (real)',
      iphone: const AdminHomeScreen(),
      desktop: const AdminHomeScreen(),
    );

