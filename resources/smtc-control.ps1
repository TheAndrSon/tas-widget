param(
  [ValidateSet('toggle', 'next', 'prev', 'seek')]
  [string]$Action = 'toggle',
  [long]$PositionMs = 0
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]

function Await($operation, $resultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
  $task = $asTask.Invoke($null, @($operation))
  $task.Wait(-1) | Out-Null
  $task.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

$session = $null
foreach ($candidate in @($manager.GetSessions())) {
  try {
    if ($candidate.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing') { $session = $candidate; break }
  } catch { }
}
if ($null -eq $session) { $session = $manager.GetCurrentSession() }
if ($null -eq $session) { exit 0 }

try {
  switch ($Action) {
    'toggle' { Await ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null }
    'next' { Await ($session.TrySkipNextAsync()) ([bool]) | Out-Null }
    'prev' { Await ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null }
    'seek' {
      $ticks = [long]($PositionMs * 10000)
      $ok = Await ($session.TryChangePlaybackPositionAsync($ticks)) ([bool])
      [Console]::Out.WriteLine("seek=" + $ok)
    }
  }
} catch {
  [Console]::Out.WriteLine("error=" + $_.Exception.Message)
}
exit 0
