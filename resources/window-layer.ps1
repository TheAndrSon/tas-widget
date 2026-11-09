$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TasWindowLayer {
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

  [DllImport("user32.dll")]
  public static extern int GetWindowLong(IntPtr hWnd, int idx);

  [DllImport("user32.dll")]
  public static extern int SetWindowLong(IntPtr hWnd, int idx, int value);

  [DllImport("dwmapi.dll")]
  public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

  // DWMWA_BORDER_COLOR = 34, DWMWA_COLOR_NONE = 0xFFFFFFFE
  private static void RemoveBorder(IntPtr hWnd) {
    int none = unchecked((int)0xFFFFFFFE);
    DwmSetWindowAttribute(hWnd, 34, ref none, 4);
  }

  public static bool Apply(Int64 handle, bool always) {
    IntPtr hWnd = new IntPtr(handle);
    IntPtr after = always ? new IntPtr(-1) : new IntPtr(-2);
    uint flags = 0x0001 | 0x0002 | 0x0010; // NOSIZE | NOMOVE | NOACTIVATE
    bool ok = SetWindowPos(hWnd, after, 0, 0, 0, 0, flags);
    // SetWindowPos (смена Z-порядка) сбрасывает цвет рамки DWM на стандартный,
    // поэтому после каждого применения слоя снова убираем рамку.
    RemoveBorder(hWnd);
    return ok;
  }

  // WS_EX_LAYERED = 0x80000, WS_EX_TRANSPARENT = 0x20
  // Клики сквозь окно без WS_EX_LAYERED: именно layered-состояние заставляет
  // Windows 11 рисовать серую рамку вокруг прозрачного окна.
  public static bool SetClickThrough(Int64 handle, bool enabled) {
    IntPtr hWnd = new IntPtr(handle);
    int ex = GetWindowLong(hWnd, -20);
    if (enabled) {
      ex = (ex | 0x20) & ~0x80000;
    } else {
      ex = ex & ~0x20;
    }
    SetWindowLong(hWnd, -20, ex);
    RemoveBorder(hWnd);
    return true;
  }

  public static int RemoveBorderOnly(Int64 handle) {
    int none = unchecked((int)0xFFFFFFFE);
    return DwmSetWindowAttribute(new IntPtr(handle), 34, ref none, 4);
  }
}
'@

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $line = $line.Trim()
  if (-not $line) { continue }
  try {
    $data = $line | ConvertFrom-Json
    $handle = [Int64]$data.h
    if ($data.PSObject.Properties.Name -contains 'click') {
      $res = [TasWindowLayer]::SetClickThrough($handle, [bool]$data.click)
      [Console]::Out.WriteLine("click=$res handle=$handle")
      continue
    }
    if ($data.PSObject.Properties.Name -contains 'border') {
      $res = [TasWindowLayer]::RemoveBorderOnly($handle)
      [Console]::Out.WriteLine("border=$res handle=$handle")
      continue
    }
    $always = [bool]$data.always
    $ok = [TasWindowLayer]::Apply($handle, $always)
    [Console]::Out.WriteLine("ok=$ok handle=$handle")
  } catch {
    [Console]::Out.WriteLine("ok=False error=$($_.Exception.Message)")
  }
}
