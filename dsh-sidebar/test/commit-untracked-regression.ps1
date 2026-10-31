$ErrorActionPreference = 'Stop'

# User-facing oracle: clicking Commit with no staged rows must still create the
# requested commit, including the untracked files visible in the Changes group.
# This reproduces the current host implementation's `git commit -a -m` plan.
$root = Join-Path ([System.IO.Path]::GetTempPath()) ("dsh-sidebar-commit-red-" + [guid]::NewGuid().ToString('N'))
$failures = 0

function Invoke-Git([string[]] $Arguments) {
  $output = @(& git @Arguments 2>&1)
  [pscustomobject]@{
    ExitCode = $LASTEXITCODE
    Output = ($output -join "`n")
  }
}

function Check-Equal([string] $Label, $Expected, $Actual, [string] $Detail) {
  if ($Expected -eq $Actual) {
    Write-Output "ok   $Label"
    return
  }
  $script:failures += 1
  Write-Output "FAIL $Label"
  Write-Output "  expected: $Expected"
  Write-Output "  actual:   $Actual"
  if ($Detail) { Write-Output "  detail:   $Detail" }
}

New-Item -ItemType Directory -Path $root | Out-Null
Push-Location $root
try {
  $init = Invoke-Git @('init', '--quiet')
  Check-Equal 'temporary repository initializes' 0 $init.ExitCode $init.Output

  Invoke-Git @('config', 'user.email', 'dsh-sidebar-test@example.invalid') | Out-Null
  Invoke-Git @('config', 'user.name', 'dsh-sidebar-test') | Out-Null
  Set-Content -LiteralPath (Join-Path $root 'untracked.txt') -Value 'untracked content' -Encoding utf8

  # Fixed host plan when no file is staged: stage the whole worktree first,
  # then commit. `git commit -a` skips untracked.txt.
  $stage = Invoke-Git @('add', '-A')
  Check-Equal 'all-change plan stages the worktree' 0 $stage.ExitCode $stage.Output
  $commit = Invoke-Git @('commit', '-m', 'commit untracked file')
  Check-Equal 'commit action includes an untracked file' 0 $commit.ExitCode $commit.Output

  if ($commit.ExitCode -eq 0) {
    $tracked = Invoke-Git @('ls-files', '--error-unmatch', 'untracked.txt')
    Check-Equal 'untracked file is recorded by the commit' 0 $tracked.ExitCode $tracked.Output
    $subject = Invoke-Git @('log', '-1', '--format=%s')
    Check-Equal 'commit message is preserved' 'commit untracked file' $subject.Output.Trim() $subject.Output
  }
}
finally {
  Pop-Location
  if (Test-Path -LiteralPath $root) {
    $resolved = (Resolve-Path -LiteralPath $root).Path
    if ($resolved -eq $root) { Remove-Item -LiteralPath $root -Recurse -Force }
  }
}

Write-Output ($failures -eq 0 ? 'all commit regression checks passed' : "$failures check(s) failed")
exit ([int]($failures -gt 0))
