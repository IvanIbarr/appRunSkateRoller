# Script para agregar PostgreSQL al PATH permanentemente en Windows

# Ruta de PostgreSQL
$pgPath = "D:\curso kotlin\recursos de la app roller\PostgreSQL\16\bin"

# Obtener el PATH actual del sistema
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Verificar si ya está en el PATH
if ($currentPath -notlike "*$pgPath*") {
    # Agregar al PATH del usuario
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgPath", "User")
    Write-Host "✅ PostgreSQL agregado al PATH del usuario"
    Write-Host "⚠️  Necesitas reiniciar PowerShell o cerrar y abrir la terminal para que tome efecto"
} else {
    Write-Host "✅ PostgreSQL ya está en el PATH"
}

Write-Host ""
Write-Host "Para verificar en una nueva terminal, ejecuta:"
Write-Host "psql --version"

