Add-Type -AssemblyName System.Drawing

function New-RoundedPath([System.Drawing.RectangleF]$rect, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
  $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
  $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-WidgetIcon([int]$size, [string]$outPath) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $pad = [float]($size * 0.05)
  $rect = New-Object System.Drawing.RectangleF($pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad))
  $radius = [float]($size * 0.26)
  $path = New-RoundedPath $rect $radius

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 118, 168, 255),
    [System.Drawing.Color]::FromArgb(255, 152, 236, 208),
    45.0
  )
  $g.FillPath($brush, $path)

  $inner = New-RoundedPath (New-Object System.Drawing.RectangleF(($pad + $size * 0.018), ($pad + $size * 0.018), ($size - 2 * $pad - $size * 0.036), ($size - 2 * $pad - $size * 0.036))) ($radius * 0.92)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), [float]([Math]::Max(1.0, $size * 0.012)))
  $g.DrawPath($pen, $inner)

  $dot = [float]($size * 0.135)
  $gap = [float]($size * 0.085)
  $center = $size / 2.0
  $offset = $dot / 2.0 + $gap / 2.0
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(242, 255, 255, 255))
  foreach ($dx in @(-1, 1)) {
    foreach ($dy in @(-1, 1)) {
      $x = $center + $dx * $offset - $dot / 2.0
      $y = $center + $dy * $offset - $dot / 2.0
      $g.FillEllipse($white, [float]$x, [float]$y, $dot, $dot)
    }
  }

  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $pen.Dispose(); $white.Dispose(); $path.Dispose(); $inner.Dispose()
  Write-Output ("saved " + $outPath)
}

New-WidgetIcon 32 "D:\OpenCode_Projects\Widget\resources\tray.png"
New-WidgetIcon 256 "D:\OpenCode_Projects\Widget\resources\icon.png"
