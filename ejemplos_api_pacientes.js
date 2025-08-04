// EJEMPLOS DE USO DE LA API PARA PACIENTES Y TUTORES
// Fecha: 3 de agosto de 2025

// ==================== RUTAS GET ====================

// 1. Obtener todos los pacientes con información de tutores
// GET http://localhost:3000/api/pacientes

// 2. Obtener paciente por ID
// GET http://localhost:3000/api/pacientes/1

// 3. Buscar paciente por RUT
// GET http://localhost:3000/api/pacientes/rut/12345678-9

// 4. Obtener pacientes con tutor (menores de edad)
// GET http://localhost:3000/api/pacientes/con-tutor

// 5. Obtener pacientes sin tutor (adultos)
// GET http://localhost:3000/api/pacientes/sin-tutor

// 6. Obtener todos los tutores
// GET http://localhost:3000/api/tutores

// 7. Obtener tutor por ID con sus pacientes
// GET http://localhost:3000/api/tutores/1

// 8. Obtener estadísticas
// GET http://localhost:3000/api/pacientes/estadisticas/resumen

// ==================== RUTAS POST ====================

// 1. Crear paciente adulto (sin tutor)
// POST http://localhost:3000/api/pacientes
// Content-Type: application/json
/*
{
  "nombre": "Juan",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "Silva",
  "rut": "12345678-9",
  "telefono": "+56911111111",
  "correo": "juan.perez@email.com",
  "direccion": "Calle Nueva 789",
  "nacionalidad": "Chilena"
}
*/

// 2. Crear paciente con tutor (menor de edad)
// POST http://localhost:3000/api/pacientes/con-tutor
// Content-Type: application/json
/*
{
  "nombrePaciente": "Ana",
  "apellidoPaterno": "González",
  "apellidoMaterno": "Martínez",
  "rut": "98765432-1",
  "telefonoPaciente": null,
  "correoPaciente": null,
  "direccionPaciente": "Av. Principal 123",
  "nacionalidad": "Chilena",
  "nombreTutor": "María",
  "apellidoTutor": "González",
  "direccionTutor": "Av. Principal 123",
  "correoTutor": "maria.gonzalez@email.com",
  "telefonoTutor": "+56912345678"
}
*/

// 3. Crear solo tutor
// POST http://localhost:3000/api/tutores
// Content-Type: application/json
/*
{
  "nombre": "Carlos",
  "apellido": "Rodríguez",
  "direccion": "Calle Secundaria 456",
  "correo": "carlos.rodriguez@email.com",
  "telefono": "+56987654321"
}
*/

// 4. Asignar tutor existente a paciente
// POST http://localhost:3000/api/pacientes/1/asignar-tutor
// Content-Type: application/json
/*
{
  "idTutor": 2
}
*/

// ==================== RUTAS PUT/DELETE (en expireRoutes) ====================

// 1. Actualizar información de paciente
// PUT http://localhost:3000/api/pacientes/1
// Content-Type: application/json
/*
{
  "nombre": "Juan Carlos",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "Silva",
  "telefono": "+56922222222",
  "correo": "juan.carlos.perez@email.com",
  "direccion": "Nueva Dirección 123",
  "nacionalidad": "Chilena"
}
*/

// 2. Actualizar información de tutor
// PUT http://localhost:3000/api/tutores/1
// Content-Type: application/json
/*
{
  "nombre": "María Elena",
  "apellido": "González",
  "direccion": "Av. Principal 456",
  "correo": "maria.elena.gonzalez@email.com",
  "telefono": "+56933333333"
}
*/

// 3. Remover tutor de paciente (convertir a adulto)
// POST http://localhost:3000/api/pacientes/2/remover-tutor

// 4. Eliminar paciente
// DELETE http://localhost:3000/api/pacientes/1

// 5. Eliminar tutor (solo si no tiene pacientes)
// DELETE http://localhost:3000/api/tutores/1

// ==================== RESPUESTAS TÍPICAS ====================

// Respuesta exitosa al crear paciente:
/*
{
  "message": "Paciente creado correctamente",
  "idPaciente": 1
}
*/

// Respuesta exitosa al crear paciente con tutor:
/*
{
  "message": "Paciente y tutor creados correctamente",
  "idPaciente": 2,
  "idTutor": 1
}
*/

// Respuesta de error:
/*
{
  "error": "Ya existe un paciente con este RUT"
}
*/

// Estadísticas típicas:
/*
{
  "totalPacientes": 10,
  "pacientesConTutor": 3,
  "pacientesSinTutor": 7,
  "totalTutores": 3
}
*/

// ==================== CÓDIGOS DE ESTADO HTTP ====================
// 200 - OK (operación exitosa)
// 201 - Created (recurso creado)
// 400 - Bad Request (datos inválidos)
// 404 - Not Found (recurso no encontrado)
// 409 - Conflict (conflicto, ej: RUT duplicado)
// 500 - Internal Server Error (error del servidor)
