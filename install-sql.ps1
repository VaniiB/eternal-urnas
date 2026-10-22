$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Vanii\Desktop\eternal-urnas'
$work = Join-Path $root '.sql-install'
New-Item -ItemType Directory -Force -Path $work | Out-Null
$log = Join-Path $work 'install.log'

function Log([string]$message) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $message"
  Add-Content -Path $log -Value $line -Encoding utf8
  Write-Output $line
}

$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Log 'Windows va a pedir permiso de administrador. Toca Si.'
  try {
    $elevated = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath
    )
  } catch {
    Log "No se abrio el permiso: $($_.Exception.Message)"
    exit 1
  }
  Get-Content $log -Tail 20
  exit $elevated.ExitCode
}

Log 'Instalacion elevada'
$map = @{}
foreach ($line in [System.IO.File]::ReadAllLines((Join-Path $root 'backend\.env'))) {
  if ($line -match '^([^#=]+)=(.*)$') { $map[$Matches[1]] = $Matches[2] }
}
$sapwd = $map['DB_ADMIN_PASSWORD']
if (-not $sapwd) { Log 'Falta DB_ADMIN_PASSWORD'; exit 1 }
$account = "$env:USERDOMAIN\$env:USERNAME"

$bootstrap = Join-Path $work 'SQL2022-SSEI-Expr.exe'
if (-not (Test-Path $bootstrap)) {
  Log 'Descargando el instalador de Microsoft'
  Invoke-WebRequest -Uri 'https://download.microsoft.com/download/29654887-7cde-4397-bba3-d7f087970845/SQL2022-SSEI-Expr.exe' -OutFile $bootstrap
}

$media = Join-Path $work 'media-enu'
$extracted = Join-Path $work 'extracted-enu'
$setup = Get-ChildItem -Path $extracted -Filter SETUP.EXE -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\x64\\' } | Select-Object -First 1
if (-not $setup) {
  $package = Get-ChildItem -Path $media -Filter 'SQLEXPR_x64_ENU.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $package) {
    Log 'Descargando SQL Server Express en ingles'
    New-Item -ItemType Directory -Force -Path $media | Out-Null
    $download = Start-Process -FilePath $bootstrap -Wait -PassThru -ArgumentList @(
      '/ACTION=Download', "/MEDIAPATH=$media", '/MEDIATYPE=Core', '/LANGUAGE=en-US', '/QUIET'
    )
    Log "Descarga terminada con codigo $($download.ExitCode)"
    $package = Get-ChildItem -Path $media -Filter 'SQLEXPR_x64_ENU.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  }
  if (-not $package) { Log 'FALLO: no se descargo el instalador en ingles'; exit 1 }
  Log 'Extrayendo el instalador en ingles'
  $unpack = Start-Process -FilePath $package.FullName -Wait -PassThru -ArgumentList @("/x:$extracted", '/q')
  Log "Extraccion terminada con codigo $($unpack.ExitCode)"
  $setup = Get-ChildItem -Path $extracted -Filter SETUP.EXE -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\x64\\' } | Select-Object -First 1
}
if (-not $setup) { Log 'FALLO: no aparecio SETUP.EXE'; exit 1 }

$service = Get-Service 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
if (-not $service) {
  Log 'Instalando el motor. Puede tardar varios minutos.'
  $args = "/QS /ENU /ACTION=Install /FEATURES=SQLENGINE /INSTANCENAME=SQLEXPRESS /IACCEPTSQLSERVERLICENSETERMS /SECURITYMODE=SQL /SAPWD=`"$sapwd`" /SQLSYSADMINACCOUNTS=`"BUILTIN\Administrators`" `"$account`" /TCPENABLED=1 /NPENABLED=1 /SQLSVCSTARTUPTYPE=Automatic /BROWSERSVCSTARTUPTYPE=Automatic /UpdateEnabled=0"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $setup.FullName
  $psi.Arguments = $args
  $psi.WorkingDirectory = $setup.DirectoryName
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  [void]$proc.Start()
  $stdout = $proc.StandardOutput.ReadToEnd()
  $stderr = $proc.StandardError.ReadToEnd()
  $proc.WaitForExit()
  $console = Join-Path $work 'setup-console.txt'
  [System.IO.File]::WriteAllText($console, ($stdout + "`n" + $stderr))
  Log "Setup termino con codigo $($proc.ExitCode)"
  if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne 3010) {
    Log 'FALLO: el instalador no termino bien.'
    if ($stderr) { Log $stderr.Trim() }
    if ($stdout) { Log ($stdout.Trim().Substring(0, [Math]::Min(500, $stdout.Trim().Length))) }
    exit $proc.ExitCode
  }
} else {
  Log 'La instancia SQLEXPRESS ya estaba instalada'
}

$portKey = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll'
if (Test-Path $portKey) {
  Set-ItemProperty -Path $portKey -Name TcpPort -Value '1433'
  Set-ItemProperty -Path $portKey -Name TcpDynamicPorts -Value ''
  Log 'Puerto TCP 1433 configurado'
}
Set-Service -Name 'SQLBrowser' -StartupType Automatic -ErrorAction SilentlyContinue
Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
Start-Service -Name 'SQLBrowser' -ErrorAction SilentlyContinue
$firewall = Get-NetFirewallRule -DisplayName 'SQL Server Express Eternal' -ErrorAction SilentlyContinue
if (-not $firewall) {
  New-NetFirewallRule -DisplayName 'SQL Server Express Eternal' -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow | Out-Null
}

$envPath = Join-Path $root 'backend\.env'
$envText = [System.IO.File]::ReadAllText($envPath)
$envText = [regex]::Replace($envText, '(?m)^DB_PORT=.*$', 'DB_PORT=1433')
$envText = [regex]::Replace($envText, '(?m)^DB_INSTANCE=.*$', 'DB_INSTANCE=')
[System.IO.File]::WriteAllText($envPath, $envText)
Log 'LISTO: SQL Server Express escucha en localhost,1433'
exit 0
