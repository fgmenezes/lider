@echo off
REM === CONFIGURAÇÕES ===
set USUARIO_LOCAL=postgres
set SENHA_LOCAL=postgres
set BANCO_LOCAL=lider
set HOST_LOCAL=localhost
set PORTA_LOCAL=5432

set USUARIO_REMOTO=postgres
set SENHA_REMOTO=@Ap210484
set BANCO_REMOTO=postgres
set HOST_REMOTO=144.22.137.177
set PORTA_REMOTO=15432

REM === 1. Gerar dump do banco local ===
echo Gerando dump do banco local...
set PGPASSWORD=%SENHA_LOCAL%
pg_dump -U %USUARIO_LOCAL% -h %HOST_LOCAL% -p %PORTA_LOCAL% -d %BANCO_LOCAL% -F c -b -v -f dump_lider.backup
set PGPASSWORD=

REM === 2. Restaurar dump no banco remoto ===
echo.
echo Restaurando dump no banco do Coolify...
set PGPASSWORD=%SENHA_REMOTO%
pg_restore -h %HOST_REMOTO% -p %PORTA_REMOTO% -U %USUARIO_REMOTO% -d %BANCO_REMOTO% -v dump_lider.backup
set PGPASSWORD=

echo.
echo Processo concluído!
pause 