-- Script SQL para crear las tablas de representantes
-- Ejecutar este script en la base de datos del proyecto

-- Tabla de representantes
CREATE TABLE representantes (
    idRepresentante INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    rut NVARCHAR(12) NOT NULL UNIQUE,
    telefono NVARCHAR(20),
    correo NVARCHAR(150),
    direccion NVARCHAR(255),
    nacionalidad NVARCHAR(50) DEFAULT 'Chilena',
    fechaCreacion DATETIME DEFAULT GETDATE(),
    fechaModificacion DATETIME DEFAULT GETDATE()
);

-- Tabla de relación paciente-representante
CREATE TABLE paciente_representante (
    idRelacion INT IDENTITY(1,1) PRIMARY KEY,
    idPaciente INT NOT NULL,
    idRepresentante INT NOT NULL,
    relacion NVARCHAR(50) NOT NULL, -- Padre, Madre, Tutor Legal, etc.
    fechaAsignacion DATETIME DEFAULT GETDATE(),
    fechaExpiracion DATETIME NULL,
    activo BIT DEFAULT 1,
    FOREIGN KEY (idPaciente) REFERENCES paciente(idPaciente),
    FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante),
    UNIQUE(idPaciente, idRepresentante, activo) -- Evita duplicados activos
);

-- Agregar campo idRepresentante a la tabla paciente (opcional, para referencia directa)
ALTER TABLE paciente 
ADD idRepresentante INT NULL,
CONSTRAINT FK_paciente_representante FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante);

-- Índices para mejorar rendimiento
CREATE INDEX IX_representantes_rut ON representantes(rut);
CREATE INDEX IX_paciente_representante_paciente ON paciente_representante(idPaciente);
CREATE INDEX IX_paciente_representante_representante ON paciente_representante(idRepresentante);
CREATE INDEX IX_paciente_idRepresentante ON paciente(idRepresentante);

-- Trigger para actualizar fechaModificacion en representantes
CREATE TRIGGER TR_representantes_update
ON representantes
AFTER UPDATE
AS
BEGIN
    UPDATE representantes 
    SET fechaModificacion = GETDATE()
    FROM representantes r
    INNER JOIN inserted i ON r.idRepresentante = i.idRepresentante;
END;

-- Comentarios sobre las tablas
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tabla que almacena información de representantes legales de pacientes', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'representantes';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tabla de relación entre pacientes y sus representantes legales', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'paciente_representante';

-- Datos de ejemplo para testing (opcional)
/*
INSERT INTO representantes (nombre, apellido, rut, telefono, correo, direccion, nacionalidad)
VALUES 
('María', 'González', '11111111-1', '+56987654321', 'maria.gonzalez@email.com', 'Av. Libertador 123, Santiago', 'Chilena'),
('Pedro', 'Martínez', '22222222-2', '+56912345678', 'pedro.martinez@email.com', 'Calle Principal 456, Valparaíso', 'Chilena'),
('Ana', 'López', '33333333-3', '+56956789012', 'ana.lopez@email.com', 'Pasaje Central 789, Concepción', 'Chilena');
*/
