# Script para cerrar procesos de Android Studio bloqueados
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cerrando procesos de Android Studio..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar procesos de Android Studio
$studioProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*studio*" -or 
    ($_.ProcessName -eq "java" -and $_.Path -like "*android*")
}

if ($studioProcesses.Count -eq 0) {
    Write-Host "✅ No hay procesos de Android Studio ejecutándose" -ForegroundColor Green
    exit 0
}

Write-Host "Encontrados $($studioProcesses.Count) proceso(s):" -ForegroundColor Yellow
Write-Host ""

# Mostrar procesos encontrados
foreach ($proc in $studioProcesses) {
    Write-Host "  - PID $($proc.Id): $($proc.ProcessName) - $($proc.Path)" -ForegroundColor White
}

Write-Host ""
$confirm = Read-Host "¿Deseas cerrar estos procesos? (S/N)"

if ($confirm -eq "S" -or $confirm -eq "s" -or $confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "Cerrando procesos..." -ForegroundColor Cyan
    
    foreach ($proc in $studioProcesses) {
        try {
            Write-Host "  Cerrando PID $($proc.Id)..." -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "    ✅ Proceso $($proc.Id) cerrado" -ForegroundColor Green
        } catch {
            Write-Host "    ❌ Error al cerrar proceso $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Esperando 3 segundos..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
    
    # Verificar que se cerraron
    $remaining = Get-Process | Where-Object {
        $_.ProcessName -like "*studio*" -or 
        ($_.ProcessName -eq "java" -and $_.Path -like "*android*")
    }
    
    Write-Host ""
    if ($remaining.Count -eq 0) {
        Write-Host "✅ Todos los procesos fueron cerrados exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes abrir Android Studio nuevamente" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Aún quedan $($remaining.Count) proceso(s) activos:" -ForegroundColor Yellow
        $remaining | ForEach-Object {
            Write-Host "  - PID $($_.Id): $($_.ProcessName)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Intenta cerrarlos manualmente desde el Administrador de Tareas" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Operación cancelada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
