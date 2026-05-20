/**
 * Chat staff: administradores, líderes y miembros con grupo asignado.
 */
function canAccessStaffChat(user) {
  if (!user) return false;
  const tipo = user.tipoPerfil || user.tipo_perfil;
  if (tipo === 'administrador' || tipo === 'liderGrupo') return true;
  const grupoId = user.grupoId ?? user.grupo_id;
  return grupoId != null && String(grupoId).trim() !== '';
}

module.exports = {canAccessStaffChat};
