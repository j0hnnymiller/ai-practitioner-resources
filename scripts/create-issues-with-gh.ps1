#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Create GitHub issues from issue templates using GitHub CLI (gh)

.DESCRIPTION
    This script reads all markdown files from .github/ISSUE_TEMPLATE/
    and creates GitHub issues using the GitHub CLI (gh) commands.

.PARAMETER DryRun
    If specified, shows what would be created without actually creating issues

.EXAMPLE
    .\scripts\create-issues-with-gh.ps1

.EXAMPLE
    .\scripts\create-issues-with-gh.ps1 -DryRun
#>

param(
    [switch]$DryRun
)

# Configuration
$TemplatesDir = Join-Path $PSScriptRoot ".." ".github" "ISSUE_TEMPLATE"
$CreatedIssues = @()
$SkippedIssues = @()
$FailedIssues = @()

function Get-FrontMatter {
    param([string]$Content)

    if ($Content -match '^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$') {
        $frontMatterText = $Matches[1]
        $bodyText = $Matches[2].Trim()

        $frontMatterData = @{}

        $frontMatterText -split '\n' | ForEach-Object {
            if ($_ -match '^([^:]+):\s*(.*)$') {
                $keyName = $Matches[1].Trim()
                $keyValue = $Matches[2].Trim()

                # Remove quotes
                $keyValue = $keyValue -replace '^["'']|["'']$', ''

                # Parse arrays (labels)
                if ($keyValue -match '^\[(.*)\]$') {
                    $keyValue = $Matches[1] -split ',' | ForEach-Object {
                        $_.Trim() -replace '^["'']|["'']$', ''
                    } | Where-Object { $_ }
                }

                $frontMatterData[$keyName] = $keyValue
            }
        }

        return @{
            FrontMatter = $frontMatterData
            Body        = $bodyText
        }
    }

    return @{
        FrontMatter = @{}
        Body        = $Content
    }
}

function Test-IssueExists {
    param([string]$Title)

    try {
        $existingIssues = gh issue list --search "in:title `"$Title`"" --json number,title,state | ConvertFrom-Json
        $exactMatch = $existingIssues | Where-Object { $_.title -eq $Title -and $_.state -eq "open" }
        return $exactMatch
    }
    catch {
        Write-Warning "Could not check for existing issues: $($_.Exception.Message)"
        return $null
    }
}

function New-Issue {
    param(
        [string]$Title,
        [string]$Body,
        [string[]]$Labels,
        [string[]]$Assignees,
        [switch]$DryRun
    )

    Write-Host "`n📝 Processing: $Title" -ForegroundColor Cyan

    # Check if issue already exists
    $existingIssue = Test-IssueExists -Title $Title
    if ($existingIssue) {
        Write-Host "⏭️  Skipped: Issue already exists (#$($existingIssue.number))" -ForegroundColor Yellow
        $script:SkippedIssues += @{
            Number = $existingIssue.number
            Title  = $Title
        }
        return
    }

    if ($DryRun) {
        Write-Host "🔍 DRY RUN: Would create issue with:" -ForegroundColor Yellow
        Write-Host "   Title: $Title" -ForegroundColor Gray
        $labelsText = if ($Labels) { $Labels -join ', ' } else { 'none' }
        Write-Host "   Labels: $labelsText" -ForegroundColor Gray
        $assigneesText = if ($Assignees) { $Assignees -join ', ' } else { 'none' }
        Write-Host "   Assignees: $assigneesText" -ForegroundColor Gray
        Write-Host "   Body Length: $($Body.Length) characters" -ForegroundColor Gray
        return
    }

    try {
        # First, try to create issue without labels to avoid label-not-found errors
        $ghArgs = @("issue", "create", "--title", $Title, "--body", $Body)

        # Add assignees if any (skip labels for now)
        if ($Assignees -and $Assignees.Count -gt 0 -and $Assignees[0] -ne "") {
            $ghArgs += "--assignee"
            $ghArgs += ($Assignees -join ",")
        }

        # Execute gh command to create issue first
        $result = & gh @ghArgs

        if ($LASTEXITCODE -eq 0) {
            # Extract issue number from URL
            if ($result -match '#(\d+)') {
                $issueNumber = $Matches[1]
                Write-Host "✅ Created: Issue #$issueNumber" -ForegroundColor Green
                Write-Host "   URL: $result" -ForegroundColor Gray

                # Try to add labels after creation (if they exist)
                if ($Labels -and $Labels.Count -gt 0) {
                    foreach ($label in $Labels) {
                        try {
                            gh issue edit $issueNumber --add-label $label 2>$null
                            if ($LASTEXITCODE -eq 0) {
                                Write-Host "   Added label: $label" -ForegroundColor DarkGreen
                            }
                        }
                        catch {
                            Write-Host "   Warning: Could not add label '$label' (label may not exist)" -ForegroundColor DarkYellow
                        }
                    }
                }

                $script:CreatedIssues += @{
                    Number = $issueNumber
                    Title  = $Title
                    URL    = $result
                }
            }
        }
        else {
            throw "gh command failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $script:FailedIssues += @{
            Title = $Title
            Error = $_.Exception.Message
        }
    }
}

# Main execution
Write-Host "🚀 GitHub Issue Creator using GitHub CLI" -ForegroundColor Magenta
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No issues will be created" -ForegroundColor Yellow
    Write-Host "=" * 50
}

# Check if gh is authenticated
try {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: GitHub CLI is not authenticated" -ForegroundColor Red
        Write-Host "Please run: gh auth login" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ Error: Could not check GitHub CLI authentication status" -ForegroundColor Red
    Write-Host "Please ensure GitHub CLI is installed and authenticated" -ForegroundColor Yellow
    exit 1
}

# Get current repository info
try {
    $repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
    Write-Host "Repository: $($repoInfo.nameWithOwner)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: Could not get repository information" -ForegroundColor Red
    Write-Host "Make sure you're in a valid Git repository" -ForegroundColor Yellow
    exit 1
}

Write-Host "=" * 60

# Read templates
Write-Host "📂 Reading issue templates from: $TemplatesDir"

if (-not (Test-Path $TemplatesDir)) {
    Write-Host "❌ Error: Templates directory not found: $TemplatesDir" -ForegroundColor Red
    exit 1
}

$templateFiles = Get-ChildItem -Path $TemplatesDir -Filter "*.md"

if ($templateFiles.Count -eq 0) {
    Write-Host "❌ Error: No markdown template files found in $TemplatesDir" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($templateFiles.Count) template files:" -ForegroundColor Green
$templateFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

Write-Host "`n" + "=" * 60
Write-Host "Processing templates..."

# Process each template
foreach ($templateFile in $templateFiles) {
    $content = Get-Content -Path $templateFile.FullName -Raw -Encoding UTF8
    $parsed = Get-FrontMatter -Content $content

    $title = $parsed.FrontMatter.title
    if (-not $title) {
        $title = $templateFile.BaseName -replace '-', ' '
    }

    $labels = $parsed.FrontMatter.labels
    if (-not $labels) { $labels = @() }

    $assignees = $parsed.FrontMatter.assignees
    if (-not $assignees) { $assignees = @() }

    New-Issue -Title $title -Body $parsed.Body -Labels $labels -Assignees $assignees -DryRun:$DryRun

    # Add small delay to be nice to the API
    Start-Sleep -Milliseconds 500
}

# Summary
Write-Host "`n" + "=" * 60
Write-Host "📊 Summary" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Created: $($CreatedIssues.Count) issue(s)" -ForegroundColor Green
Write-Host "⏭️  Skipped: $($SkippedIssues.Count) issue(s) (already exist)" -ForegroundColor Yellow
Write-Host "❌ Failed:  $($FailedIssues.Count) issue(s)" -ForegroundColor Red

if ($CreatedIssues.Count -gt 0) {
    Write-Host "`n📝 Created Issues:" -ForegroundColor Green
    $CreatedIssues | ForEach-Object {
        Write-Host "   - #$($_.Number): $($_.Title)" -ForegroundColor Gray
        Write-Host "     $($_.URL)" -ForegroundColor DarkGray
    }
}

if ($SkippedIssues.Count -gt 0) {
    Write-Host "`n⏭️  Skipped Issues (Already Exist):" -ForegroundColor Yellow
    $SkippedIssues | ForEach-Object {
        Write-Host "   - #$($_.Number): $($_.Title)" -ForegroundColor Gray
    }
}

if ($FailedIssues.Count -gt 0) {
    Write-Host "`n❌ Failed Issues:" -ForegroundColor Red
    $FailedIssues | ForEach-Object {
        Write-Host "   - $($_.Title): $($_.Error)" -ForegroundColor Gray
    }
}

Write-Host "`n" + "=" * 60

if ($DryRun) {
    Write-Host "🔍 This was a dry run. No issues were created." -ForegroundColor Yellow
    Write-Host "To actually create the issues, run without -DryRun parameter" -ForegroundColor Yellow
}
else {
    Write-Host "✨ Done!" -ForegroundColor Green
}

Write-Host ""

# Exit with error code if any failed (but not in dry run)
if (-not $DryRun -and $FailedIssues.Count -gt 0) {
    exit 1
}
