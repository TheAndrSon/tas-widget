# Считывает состояние Windows Media Session (SMTC) и печатает по одной JSON-строке в stdout.
# Работает с любым плеером, который публикует медиа-сессию (Яндекс Музыка, Spotify, AIMP, VLC...).
$ErrorActionPreference = 'Stop'
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch { }

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

function Read-Thumbnail($thumbnail) {
  if ($null -eq $thumbnail) { return $null }
  $stream = Await ($thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  if ($null -eq $stream) { return $null }
  $size = [uint32]$stream.Size
  if ($size -le 0 -or $size -gt 3000000) {
    return $null
  }
  $reader = [Windows.Storage.Streams.DataReader]::new($stream)
  Await ($reader.LoadAsync($size)) ([uint32]) | Out-Null
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  return [Convert]::ToBase64String($bytes)
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

$lastArtKey = ''
$lastSessionId = ''

while ($true) {
  $payload = @{
    updatedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    status    = 'closed'
  }

  try {
    $session = $null
    $sessions = @($manager.GetSessions())

    foreach ($candidate in $sessions) {
      try {
        $candidateStatus = $candidate.GetPlaybackInfo().PlaybackStatus.ToString()
        if ($candidateStatus -eq 'Playing') { $session = $candidate; break }
      } catch { }
    }

    if ($null -eq $session) {
      $session = $manager.GetCurrentSession()
    }
    if ($null -eq $session -and $sessions.Count -gt 0) {
      $session = $sessions[0]
    }

    if ($null -ne $session) {
      $info = $session.GetPlaybackInfo()
      $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $timeline = $session.GetTimelineProperties()

      $status = $info.PlaybackStatus.ToString().ToLowerInvariant()
      if ($status -eq 'opened' -or $status -eq 'changing') { $status = 'stopped' }

      $duration = [double]$timeline.EndTime.TotalMilliseconds - [double]$timeline.StartTime.TotalMilliseconds
      $position = [double]$timeline.Position.TotalMilliseconds - [double]$timeline.StartTime.TotalMilliseconds

      $payload.status = $status
      $payload.title = [string]$props.Title
      $payload.artist = [string]$props.Artist
      $payload.album = [string]$props.AlbumTitle
      $payload.source = [string]$session.SourceAppUserModelId
      $payload.sessionId = [string]$session.SourceAppUserModelId
      $payload.positionMs = [Math]::Max(0, [Math]::Round($position))
      $payload.durationMs = [Math]::Max(0, [Math]::Round($duration))
      $payload.canPlay = [bool]$info.Controls.IsPlayPauseToggleEnabled
      $payload.canNext = [bool]$info.Controls.IsNextEnabled
      $payload.canPrev = [bool]$info.Controls.IsPreviousEnabled
      $canSeek = $false
      try { $canSeek = [bool]$info.Controls.IsPlaybackPositionEnabled } catch { $canSeek = $false }
      $payload.canSeek = $canSeek
      $rate = 1.0
      try { $rate = [double]$info.PlaybackRate } catch { $rate = 1.0 }
      if ($rate -le 0 -or $rate -gt 16) { $rate = 1.0 }
      $payload.playbackRate = $rate

      $artKey = "$($props.Title)|$($props.Artist)|$($props.AlbumTitle)"
      if ($artKey -ne $lastArtKey) {
        $base64 = $null
        try { $base64 = Read-Thumbnail $props.Thumbnail } catch { $base64 = $null }
        if ($base64) {
          $payload.artwork = $base64
          $payload.artworkKey = $artKey
        }
        $lastArtKey = $artKey
      }
    }
  } catch {
    $payload.status = 'unavailable'
    $payload.error = $_.Exception.Message
  }

  try {
    $payload | ConvertTo-Json -Compress
  } catch { }

  Start-Sleep -Milliseconds 750
}
