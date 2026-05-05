import 'package:flutter/material.dart';

import '../core/ui/preview.dart';
import '../features/admin/presentation/admin_home_screen.dart';
import '../features/admin/presentation/admin_buzon_screen.dart';
import '../features/admin/presentation/admin_chats_screen.dart';
import '../features/admin/presentation/admin_reset_password_screen.dart';
import '../features/admin/presentation/admin_usuarios_screen.dart';
import '../features/admin/presentation/admin_ventas_screen.dart';

@Preview('Admin · Home (iPhone + Desktop)')
Widget previewAdminHomeCompare() => previewCompare(
      title: 'Admin · Home',
      iphone: const AdminHomeScreen(),
      desktop: const AdminHomeScreen(),
    );

@Preview('Admin · Usuarios (iPhone + Desktop)')
Widget previewAdminUsuariosCompare() => previewCompare(
      title: 'Admin · Usuarios',
      iphone: const AdminUsuariosScreen(),
      desktop: const AdminUsuariosScreen(),
    );

@Preview('Admin · Chats (iPhone + Desktop)')
Widget previewAdminChatsCompare() => previewCompare(
      title: 'Admin · Chats',
      iphone: const AdminChatsScreen(),
      desktop: const AdminChatsScreen(),
    );

@Preview('Admin · Ventas (iPhone + Desktop)')
Widget previewAdminVentasCompare() => previewCompare(
      title: 'Admin · Ventas',
      iphone: const AdminVentasScreen(),
      desktop: const AdminVentasScreen(),
    );

@Preview('Admin · Buzón (iPhone + Desktop)')
Widget previewAdminBuzonCompare() => previewCompare(
      title: 'Admin · Buzón',
      iphone: const AdminBuzonScreen(),
      desktop: const AdminBuzonScreen(),
    );

@Preview('Admin · Reset password (iPhone + Desktop)')
Widget previewAdminResetCompare() => previewCompare(
      title: 'Admin · Reset password',
      iphone: const AdminResetPasswordScreen(),
      desktop: const AdminResetPasswordScreen(),
    );

