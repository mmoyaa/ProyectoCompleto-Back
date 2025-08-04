-- Consultas útiles para las tablas PACIENTE y TUTORES
-- Fecha: 3 de agosto de 2025

-- 1. CONSULTA PARA OBTENER TODOS LOS PACIENTES CON SUS TUTORES (si tienen)
SELECT 
    p.idPaciente,
    p.nombre,
    p.apellidoPaterno,
    p.apellidoMaterno,
    p.rut,
    p.telefono,
    p.correo,
    p.direccion,
    p.nacionalidad,
    p.tutor,
    CASE 
        WHEN p.tutor = 1 THEN 
            CONCAT(t.nombre, ' ', t.apellido)
        ELSE 'Sin tutor'
    END AS nombreTutor,
    t.correo AS correoTutor,
    t.telefono AS telefonoTutor,
    t.direccion AS direccionTutor
FROM paciente p
LEFT JOIN tutores t ON p.idTutor = t.idTutor;

-- 2. CONSULTA PARA OBTENER SOLO PACIENTES CON TUTOR
SELECT 
    p.idPaciente,
    CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', p.apellidoMaterno) AS nombreCompleto,
    p.rut,
    CONCAT(t.nombre, ' ', t.apellido) AS nombreTutor,
    t.correo AS correoTutor,
    t.telefono AS telefonoTutor
FROM paciente p
INNER JOIN tutores t ON p.idTutor = t.idTutor
WHERE p.tutor = 1;

-- 3. CONSULTA PARA OBTENER PACIENTES SIN TUTOR (ADULTOS)
SELECT 
    idPaciente,
    CONCAT(nombre, ' ', apellidoPaterno, ' ', apellidoMaterno) AS nombreCompleto,
    rut,
    telefono,
    correo,
    direccion,
    nacionalidad
FROM paciente
WHERE tutor = 0;

-- 4. CONTAR PACIENTES POR TIPO (CON Y SIN TUTOR)
SELECT 
    CASE 
        WHEN tutor = 1 THEN 'Con Tutor'
        ELSE 'Sin Tutor'
    END AS tipoPaciente,
    COUNT(*) AS cantidad
FROM paciente
GROUP BY tutor;

-- 5. BUSCAR PACIENTE POR RUT
SELECT 
    p.*,
    CASE 
        WHEN p.tutor = 1 THEN 
            CONCAT(t.nombre, ' ', t.apellido)
        ELSE NULL
    END AS nombreTutor
FROM paciente p
LEFT JOIN tutores t ON p.idTutor = t.idTutor
WHERE p.rut = '12345678-9'; -- Reemplazar con el RUT a buscar

-- 6. BUSCAR TUTORES Y SUS PACIENTES ASOCIADOS
SELECT 
    t.idTutor,
    CONCAT(t.nombre, ' ', t.apellido) AS nombreTutor,
    t.correo AS correoTutor,
    t.telefono AS telefonoTutor,
    COUNT(p.idPaciente) AS cantidadPacientes,
    STRING_AGG(CONCAT(p.nombre, ' ', p.apellidoPaterno), ', ') AS nombresPacientes
FROM tutores t
LEFT JOIN paciente p ON t.idTutor = p.idTutor
GROUP BY t.idTutor, t.nombre, t.apellido, t.correo, t.telefono;

-- 7. PROCEDIMIENTO ALMACENADO PARA INSERTAR PACIENTE CON TUTOR
CREATE PROCEDURE InsertarPacienteConTutor
    @nombrePaciente NVARCHAR(100),
    @apellidoPaterno NVARCHAR(100),
    @apellidoMaterno NVARCHAR(100),
    @rut NVARCHAR(12),
    @telefonoPaciente NVARCHAR(20) = NULL,
    @correoPaciente NVARCHAR(150) = NULL,
    @direccionPaciente NVARCHAR(255) = NULL,
    @nacionalidad NVARCHAR(50) = 'Chilena',
    @nombreTutor NVARCHAR(100),
    @apellidoTutor NVARCHAR(100),
    @direccionTutor NVARCHAR(255) = NULL,
    @correoTutor NVARCHAR(150) = NULL,
    @telefonoTutor NVARCHAR(20) = NULL
AS
BEGIN
    BEGIN TRANSACTION;
    
    DECLARE @idTutor INT;
    
    -- Insertar tutor
    INSERT INTO tutores (nombre, apellido, direccion, correo, telefono)
    VALUES (@nombreTutor, @apellidoTutor, @direccionTutor, @correoTutor, @telefonoTutor);
    
    SET @idTutor = SCOPE_IDENTITY();
    
    -- Insertar paciente con tutor
    INSERT INTO paciente (nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, direccion, nacionalidad, tutor, idTutor)
    VALUES (@nombrePaciente, @apellidoPaterno, @apellidoMaterno, @rut, @telefonoPaciente, @correoPaciente, @direccionPaciente, @nacionalidad, 1, @idTutor);
    
    COMMIT TRANSACTION;
    
    SELECT 'Paciente y tutor insertados correctamente' AS mensaje;
END;

-- 8. PROCEDIMIENTO PARA INSERTAR PACIENTE SIN TUTOR
CREATE PROCEDURE InsertarPacienteSinTutor
    @nombre NVARCHAR(100),
    @apellidoPaterno NVARCHAR(100),
    @apellidoMaterno NVARCHAR(100),
    @rut NVARCHAR(12),
    @telefono NVARCHAR(20) = NULL,
    @correo NVARCHAR(150) = NULL,
    @direccion NVARCHAR(255) = NULL,
    @nacionalidad NVARCHAR(50) = 'Chilena'
AS
BEGIN
    INSERT INTO paciente (nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, direccion, nacionalidad, tutor, idTutor)
    VALUES (@nombre, @apellidoPaterno, @apellidoMaterno, @rut, @telefono, @correo, @direccion, @nacionalidad, 0, NULL);
    
    SELECT 'Paciente insertado correctamente' AS mensaje;
END;
