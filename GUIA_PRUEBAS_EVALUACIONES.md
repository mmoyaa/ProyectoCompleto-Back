# 🧪 GUÍA COMPLETA PARA PROBAR "GUARDAR EVALUACIÓN"

## 📋 Métodos de Prueba Disponibles

### 1. 🔧 Prueba Directa de Base de Datos
**Ejecutar**: `node test_guardar_evaluacion.js`

**¿Qué hace?**
- ✅ Verifica que la tabla EvaluacionesSensoriales existe
- ✅ Confirma que hay pacientes disponibles
- ✅ Crea una evaluación de prueba directamente en la BD
- ✅ Verifica que se guardó correctamente
- ✅ Prueba actualización de registros
- ✅ Muestra estadísticas del sistema

**Salida esperada**:
```
🚀 Iniciando pruebas del sistema de evaluaciones...
✅ Conexión exitosa
✅ Tabla EvaluacionesSensoriales existe
✅ Pacientes encontrados
✅ Evaluación creada con ID: 123
✅ Evaluación verificada
✅ Evaluación actualizada correctamente
🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!
```

### 2. 🌐 Prueba de API REST
**Ejecutar**: `node test_api_evaluaciones.js`

**Prerequisitos**: El servidor debe estar corriendo (`npm start`)

**¿Qué hace?**
- ✅ Verifica conexión al servidor
- ✅ Obtiene lista de evaluaciones existentes
- ✅ Crea nueva evaluación vía POST
- ✅ Consulta la evaluación creada vía GET
- ✅ Actualiza la evaluación vía PUT
- ✅ Obtiene estadísticas actualizadas

**Salida esperada**:
```
🌐 Probando API REST de Evaluaciones...
✅ Servidor está corriendo y responde
✅ Evaluación creada exitosamente
✅ Evaluación obtenida correctamente
✅ Evaluación actualizada exitosamente
🎉 ¡TODAS LAS PRUEBAS DE API PASARON EXITOSAMENTE!
```

### 3. 🖥️ Prueba Manual desde Frontend

#### Paso a Paso:

1. **Iniciar Backend**:
   ```bash
   cd "Backend -Mantenedors"
   npm start
   ```

2. **Iniciar Frontend**:
   ```bash
   cd "Front-Mantenedor/mantenedorfull"
   ng serve
   ```

3. **Navegar a la aplicación**:
   - Ir a: `http://localhost:4200`
   - Navegar a: Evaluaciones Sensoriales

4. **Crear nueva evaluación**:
   - Clic en "Nueva Evaluación"
   - Seleccionar un paciente
   - Completar algunas preguntas
   - Guardar progreso
   - Verificar que aparece en la lista

### 4. 📊 Verificación en Base de Datos

**Query SQL para verificar**:
```sql
-- Verificar últimas evaluaciones creadas
SELECT TOP 5
    e.idEvaluacion,
    e.idPaciente,
    p.nombre + ' ' + p.apellidoPaterno AS nombrePaciente,
    e.progreso,
    e.estado,
    e.evaluadorNombre,
    e.fechaCreacion,
    e.fechaActualizacion
FROM EvaluacionesSensoriales e
INNER JOIN paciente p ON e.idPaciente = p.idPaciente
ORDER BY e.fechaCreacion DESC;
```

**Query para estadísticas**:
```sql
SELECT 
    COUNT(*) as total,
    COUNT(DISTINCT idPaciente) as pacientes_unicos,
    AVG(progreso) as progreso_promedio,
    COUNT(CASE WHEN estado = 'Completada' THEN 1 END) as completadas,
    COUNT(CASE WHEN estado = 'En Progreso' THEN 1 END) as en_progreso
FROM EvaluacionesSensoriales;
```

## 🚀 Ejecución Rápida

### Paso 1: Preparar el entorno
```bash
# Asegurar que la tabla existe
node crear_tabla_desde_nodejs.js

# O usar el script simple en SSMS
# Ejecutar: CREAR_TABLA_SIMPLE.sql
```

### Paso 2: Ejecutar pruebas
```bash
# Prueba 1: Base de datos directa
node test_guardar_evaluacion.js

# Prueba 2: API REST (requiere servidor corriendo)
npm start &
node test_api_evaluaciones.js
```

### Paso 3: Verificar resultados
```bash
# Ver logs del servidor
# Verificar que no hay errores
# Confirmar que las respuestas incluyen los datos guardados
```

## ❌ Resolución de Problemas

### Error: "Table doesn't exist"
```bash
# Solución:
node crear_tabla_desde_nodejs.js
# O ejecutar CREAR_TABLA_SIMPLE.sql en SSMS
```

### Error: "No patients found"
```sql
-- Crear un paciente de prueba:
INSERT INTO paciente (nombre, apellidoPaterno, rut, telefono, correo)
VALUES ('Juan', 'Pérez', '12345678-9', '555-1234', 'juan@test.com');
```

### Error: "Server not responding"
```bash
# Verificar que el servidor esté corriendo:
cd "Backend -Mantenedors"
npm start

# Verificar puerto:
netstat -an | findstr :3000
```

### Error: "Permission denied"
```
# Ejecutar como administrador
# O verificar credenciales en .env
```

## 📈 Resultados Esperados

### ✅ Prueba Exitosa:
- ✅ Tabla existe y es accesible
- ✅ Se pueden insertar registros
- ✅ Los registros se recuperan correctamente
- ✅ Las actualizaciones funcionan
- ✅ La API responde correctamente
- ✅ El frontend puede crear y mostrar evaluaciones

### ❌ Indicadores de Problemas:
- ❌ Errores de conexión a BD
- ❌ Tabla no existe
- ❌ Constraint violations
- ❌ API no responde
- ❌ Frontend no se conecta al backend

## 🎯 Checklist de Verificación

- [ ] Tabla EvaluacionesSensoriales existe
- [ ] Al menos un paciente existe en la BD
- [ ] Servidor backend funciona (puerto 3000)
- [ ] API endpoints responden correctamente
- [ ] Frontend Angular funciona (puerto 4200)
- [ ] Se pueden crear evaluaciones manualmente
- [ ] Las evaluaciones aparecen en la lista
- [ ] Las estadísticas se actualizan
- [ ] Los datos se persisten entre sesiones

**¡Con estos métodos puedes verificar completamente que el sistema de guardar evaluaciones funciona correctamente!** 🎉
