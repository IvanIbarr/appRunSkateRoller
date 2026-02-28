# Script PowerShell para crear la tabla de mensajes en PostgreSQL
# Asegúrate de tener psql instalado y en el PATH

$env:PGPASSWORD = "admin123"  # Cambia esto si tu contraseña es diferente
$host = "localhost"
$port = "5432"
$database = "siig_roller_db"
$user = "postgres"

Write-Host "Creando tabla de mensajes en PostgreSQL..." -ForegroundColor Green

# Ejecutar el script SQL
psql -h $host -p $port -U $user -d $database -f "create-mensajes-table-safe.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "¡Tabla creada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "Error al crear la tabla. Por favor, revisa los errores arriba." -ForegroundColor Red
}

