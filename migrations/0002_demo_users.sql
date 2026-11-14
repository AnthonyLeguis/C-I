-- C&I · Usuarios de demostración con contraseñas PBKDF2 (Gabriel, G1).
-- C&I.md §5.3: Contraseña para todos los usuarios demo: Demo-2026!
-- Salt e iteraciones: 100 000 iteraciones con HMAC-SHA-256.

INSERT OR REPLACE INTO users (id, username, display_name, role, password_hash, salt) VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'supervisor',
    'Supervisor de seguridad (demo)',
    'SUPERVISOR',
    '9da21c41ecd136547ebdd93f3e547163524a8a9c722a7a3186466dbf9e0a4ca7',
    '10000000000000000000000000000002'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'analista',
    'Analista de seguridad (demo)',
    'ANALYST',
    'a7cadf824fcdc278470aaead86b55188b4ac1109c817048f6053228f0bfb50fb',
    '10000000000000000000000000000003'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'admin',
    'Administrador de la plataforma (demo)',
    'ADMIN',
    '3fa4df95912cae1839c96d08447862761e2b64522735ecf83f6b9cd55852a92f',
    '10000000000000000000000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'analyst',
    'Analista de seguridad (demo · alias)',
    'ANALYST',
    '73fa645aac124215f43fc2ed0fb91fa78b9eb9653560f9053618d8076e44fad1',
    '10000000000000000000000000000004'
  );
