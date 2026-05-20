/// Quién puede ver y escribir en el chat staff del grupo.
bool canAccessStaffChat(Map<String, dynamic>? me) {
  if (me == null) return false;
  final tipo = (me['tipoPerfil'] ?? '').toString();
  if (tipo == 'administrador' || tipo == 'liderGrupo') return true;
  final grupoId = (me['grupoId'] ?? me['grupo_id'] ?? '').toString().trim();
  return grupoId.isNotEmpty;
}
