$REPO = "JohnMichaelMiller/ai-practitioner-resources"
$OWNER = "JohnMichaelMiller"
$PROJECT_NUM = 5
$SCRIPT_DIR = Split-Path -Parent $PSCommandPath
$PATH_SEED_FILE = Join-Path $SCRIPT_DIR "..\docs\path-test-issues.seed.json"
$results = @()
$existingTitles = @{}

function Get-ExistingPathIssueTitles {
  $items = & gh issue list --repo $REPO --label workflow-path-test --state all --json title --limit 200 | ConvertFrom-Json
  $titles = @{}

  foreach ($item in $items) {
    $titles[$item.title] = $true
  }

  return $titles
}

function New-PathIssue {
  param($pathNum, $title, $body, $labels = @("workflow-path-test", "on the bench"))

  if ($existingTitles.ContainsKey($title)) {
    $script:results += [PSCustomObject]@{
      Path  = $pathNum
      Issue = "existing"
      URL   = ""
      Exit  = ($title -replace '\[Workflow Path Test\] ', '' -replace ' via .*', '')
    }
    Write-Host "Path $pathNum skipped: existing issue title '$title'"
    return
  }

  $labelArgs = @()
  foreach ($label in $labels) {
    $labelArgs += @("--label", $label)
  }

  $url = & gh issue create --repo $REPO --title $title --body $body @labelArgs
  $num = ($url -split "/")[-1]
  gh project item-add $PROJECT_NUM --owner $OWNER --url $url | Out-Null
  $script:results += [PSCustomObject]@{
    Path  = $pathNum
    Issue = $num
    URL   = $url
    Exit  = ($title -replace '\[Workflow Path Test\] ', '' -replace ' via .*', '')
  }
  Write-Host "Path $pathNum created: #$num $url"
}

function Get-PathSeedData {
  if (-not (Test-Path $PATH_SEED_FILE)) {
    throw "Path seed file not found: $PATH_SEED_FILE"
  }

  return Get-Content -Path $PATH_SEED_FILE -Raw | ConvertFrom-Json
}

function Format-ExpectedState {
  param($expected)

  if (-not $expected) {
    return @("   ↳ Expected state: No explicit expected state recorded")
  }

  $parts = @()

  if ($expected.issueState) {
    $parts += "Issue state $($expected.issueState)"
  }
  if ($expected.labelsPresent -and $expected.labelsPresent.Count -gt 0) {
    $labels = ($expected.labelsPresent | ForEach-Object { "**$_**" }) -join ", "
    $parts += "labels present: $labels"
  }
  if ($expected.labelsAbsent -and $expected.labelsAbsent.Count -gt 0) {
    $labels = ($expected.labelsAbsent | ForEach-Object { "**$_**" }) -join ", "
    $parts += "labels absent: $labels"
  }
  if ($expected.projectStatus) {
    $parts += "project status $($expected.projectStatus)"
  }
  if ($expected.commentContains) {
    $parts += "comment contains '$($expected.commentContains)'"
  }
  if ($expected.repositoryArtifacts -and $expected.repositoryArtifacts.Count -gt 0) {
    $parts += "repository artifacts: $($expected.repositoryArtifacts -join ', ')"
  }
  if ($expected.workflow) {
    $parts += "workflow '$($expected.workflow.name)' concludes '$($expected.workflow.conclusion)'"
  }

  if ($parts.Count -eq 0) {
    $parts += "No explicit expected state recorded"
  }

  return @("   ↳ Expected state: " + ($parts -join "; "))
}

function Render-PathIssueBody {
  param($path, $totalPaths)

  $lines = @()
  $lines += "## Path $($path.pathNumber) of $totalPaths | Exit: $($path.exitState)"
  $lines += ""
  $lines += "**Entry:** $($path.entryState)"
  $lines += "**Transition Mix:** Real $($path.transitionClassSummary.real) | Manual $($path.transitionClassSummary.manual) | Simulated $($path.transitionClassSummary.simulated)"
  $lines += ""
  $lines += "---"
  $lines += ""
  $lines += "## Steps"
  $lines += ""

  foreach ($step in $path.steps) {
    $lines += "$($step.stepNumber). ``$($step.fromState)`` → $($step.trigger) → ``$($step.toState)``"
    $lines += "   ↳ Actor: $($step.actor); Verification: $($step.verificationMode)"
    $lines += (Format-ExpectedState -expected $step.expected)
    if ($step.notes) {
      $lines += "   ↳ Notes: $($step.notes)"
    }
    $lines += ""
  }

  $lines += "---"
  $lines += ""
  $lines += "## Labels"
  $lines += ""

  $labelLines = @()
  foreach ($step in $path.steps) {
    if ($step.expected.labelsPresent -and $step.expected.labelsPresent.Count -gt 0) {
      $labelLines += "- Step $($step.stepNumber): labels present → " + (($step.expected.labelsPresent | ForEach-Object { "``$_``" }) -join ", ")
    }
    if ($step.expected.labelsAbsent -and $step.expected.labelsAbsent.Count -gt 0) {
      $labelLines += "- Step $($step.stepNumber): labels absent → " + (($step.expected.labelsAbsent | ForEach-Object { "``$_``" }) -join ", ")
    }
  }
  if ($labelLines.Count -eq 0) {
    $labelLines += "- No explicit label assertions recorded"
  }
  $lines += $labelLines
  $lines += ""

  $lines += "---"
  $lines += ""
  $lines += "## Actor Instructions"
  $lines += ""
  if ($path.actorInstructions -and $path.actorInstructions.Count -gt 0) {
    foreach ($instruction in $path.actorInstructions) {
      $lines += "- Step $($instruction.whenStep): $($instruction.actor) performs ``$($instruction.action)``"
      $lines += "  Summary: $($instruction.summary)"
    }
  }
  else {
    $lines += "- No actor instructions recorded"
  }
  $lines += ""

  $lines += "---"
  $lines += ""
  $lines += "## Implementation Prompt"
  $lines += ""
  if ($path.implementationPrompt) {
    $lines += "**Prompt ID:** $($path.implementationPrompt.id)"
    $lines += "**Apply When State:** $($path.implementationPrompt.applyWhenState)"
    $lines += "**Summary:** $($path.implementationPrompt.summary)"
    if ($path.implementationPrompt.promptText) {
      $lines += ""
      $lines += $path.implementationPrompt.promptText
    }
  }
  else {
    $lines += "No implementation prompt for this path."
  }
  $lines += ""

  $lines += "---"
  $lines += ""
  $lines += "## Exit"
  $lines += ""
  $lines += "**Exit state:** $($path.exitState)"
  $lines += "**Close reason:** $($path.closeReason)"
  $lines += ""

  $lines += "---"
  $lines += ""
  $lines += "## Verification"
  $lines += ""
  $lines += "- Real transitions: $($path.transitionClassSummary.real)"
  $lines += "- Manual transitions: $($path.transitionClassSummary.manual)"
  $lines += "- Simulated transitions: $($path.transitionClassSummary.simulated)"
  $lines += ""
  $lines += "---"
  $lines += ""
  $lines += "- [ ] Path followed correctly"

  return ($lines -join "`n")
}

$existingTitles = Get-ExistingPathIssueTitles
$seedData = Get-PathSeedData
$totalPaths = $seedData.totalPaths

foreach ($seedPath in ($seedData.paths | Sort-Object pathNumber)) {
  $body = Render-PathIssueBody -path $seedPath -totalPaths $totalPaths
  New-PathIssue $seedPath.pathNumber $seedPath.title $body $seedPath.labels
}

""
"Created workflow path test issues:"
$results | Sort-Object Path | Format-Table -AutoSize
