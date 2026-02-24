param(
  [string]$RepoRoot = "C:\Users\사용자\OneDrive\CodingProjects\blog"
)

$ready = Join-Path $RepoRoot 'content\ready'
$posts = Join-Path $RepoRoot 'content\posts'
$archive = Join-Path $RepoRoot 'content\archive'

if (!(Test-Path $ready)) { throw "ready not found: $ready" }
if (!(Test-Path $posts)) { New-Item -ItemType Directory -Path $posts | Out-Null }
if (!(Test-Path $archive)) { New-Item -ItemType Directory -Path $archive | Out-Null }

$files = Get-ChildItem $ready -File -Filter '*.md' -ErrorAction SilentlyContinue
foreach($f in $files){
  $target = Join-Path $posts $f.Name
  if (Test-Path $target) {
    $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
    $ext  = [IO.Path]::GetExtension($f.Name)
    $target = Join-Path $posts ("{0}-{1}{2}" -f $base, (Get-Date -Format 'yyyyMMdd-HHmmss'), $ext)
  }
  Move-Item $f.FullName $target -Force
  Copy-Item $target (Join-Path $archive ([IO.Path]::GetFileName($target))) -Force
}

Write-Output "Moved $($files.Count) file(s) from ready to posts."
