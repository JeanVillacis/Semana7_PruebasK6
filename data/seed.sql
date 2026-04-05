TRUNCATE TABLE reclamo_fotografias, reclamo_banderas, reclamos, polizas, vehiculos, asegurados CASCADE;

INSERT INTO asegurados (id, numero_identificacion, nombre, apellido, correo_electronico, direccion, telefono)
VALUES 
(1, '1712345678', 'Juan', 'Perez', 'juan.perez@correo.com', 'Av. Amazonas N36-152', '0991234567'),
(2, '1798765432', 'Maria', 'Lopez', 'maria.lopez@email.ec', 'Calle Guayaquil E5-12', '0987654321');

INSERT INTO vehiculos (id, placa, marca, modelo, anio)
VALUES 
(1, 'PBA-1234', 'Chevrolet', 'Aveo', 2022),
(2, 'PBC-5678', 'Kia', 'Rio', 2023);

INSERT INTO polizas (id, numero, estado, vigencia_inicio, vigencia_fin, valor_asegurado, asegurado_id, vehiculo_id)
VALUES 
(1, 'POL-2026-001', 'ACTIVA', '2026-01-01', '2026-12-31', 25000.00, 1, 1),
(2, 'POL-2026-010', 'ACTIVA', '2026-02-15', '2027-02-14', 18000.00, 2, 2);

INSERT INTO reclamos (id, numero_seguimiento, estado, fecha_incidente, fecha_creacion, monto_estimado, descripcion, ubicacion, poliza_id, deducible_calculado, monto_aprobado, motivo_decision)
VALUES 
(1, 'REC-2026-005', 'APROBADO', '2026-03-15', '2026-03-17 10:00:00', 3500.00, 'Colision lateral', 'Av. Amazonas', 1, 350.00, 3150.00, 'Monto aprobado por motor de reglas'),
(2, 'REC-2026-008', 'DESCARTADO', '2026-03-10', '2026-03-12 10:00:00', 150.00, 'Raspon leve', 'Guayaquil', 2, 200.00, 0, 'El monto no supera el deducible');

SELECT setval(pg_get_serial_sequence('asegurados', 'id'), coalesce(max(id),0) + 1, false) FROM asegurados;
SELECT setval(pg_get_serial_sequence('vehiculos', 'id'), coalesce(max(id),0) + 1, false) FROM vehiculos;
SELECT setval(pg_get_serial_sequence('polizas', 'id'), coalesce(max(id),0) + 1, false) FROM polizas;
SELECT setval(pg_get_serial_sequence('reclamos', 'id'), coalesce(max(id),0) + 1, false) FROM reclamos;
