# Frontend Infrastructure Deployment Script (PowerShell)
# Usage: .\deploy-infra.ps1 -Environment stage -DomainName stage.mark-sports.com -CertificateArn arn:aws:acm:ap-northeast-1:xxx

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "stage",
    
    [Parameter(Mandatory=$false)]
    [string]$DomainName = "stage.mark-sports.com",
    
    [Parameter(Mandatory=$false)]
    [string]$CertificateArn = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-northeast-1",
    
    [Parameter(Mandatory=$false)]
    [string]$CertificateRegion = "us-east-1"  # CloudFront requires certificates in us-east-1
)

$StackName = "ecsite-frontend-$Environment"

if ([string]::IsNullOrEmpty($CertificateArn) -and ($Environment -eq "stage" -or $Environment -eq "prod")) {
    Write-Error "Error: CertificateArn is required for stage/prod environment"
    Write-Host "Usage: .\deploy-infra.ps1 -Environment stage -DomainName stage.mark-sports.com -CertificateArn <arn>"
    exit 1
}

Write-Host "Deploying Frontend Infrastructure..."
Write-Host "Environment: $Environment"
Write-Host "Stack Name: $StackName"
Write-Host "Domain: $DomainName"
Write-Host "Region: $Region"
Write-Host ""

# Prepare parameters
$Parameters = @()
$Parameters += "Environment=$Environment"
$Parameters += "DomainName=$DomainName"

if ($CertificateArn) {
    $Parameters += "CertificateArn=$CertificateArn"
}

# Deploy CloudFormation stack
aws cloudformation deploy `
    --template-file infra/cloudformation.yaml `
    --stack-name $StackName `
    --parameter-overrides $Parameters `
    --region $Region `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment completed!"
    Write-Host ""
    
    # Get outputs
    aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs' `
        --output table
} else {
    Write-Error "Deployment failed with exit code $LASTEXITCODE"
    exit 1
}
