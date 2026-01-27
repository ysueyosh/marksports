# Frontend Build and Deploy to S3 Script (PowerShell)
# Usage: .\deploy-frontend.ps1 -Environment stage

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "stage",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-northeast-1"
)

$StackName = "ecsite-frontend-$Environment"

Write-Host "Building and Deploying Frontend..."
Write-Host "Environment: $Environment"
Write-Host ""

# 1. Build Next.js
Write-Host "1. Building Next.js application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}
Write-Host "Build completed!"
Write-Host ""

# 2. Get S3 bucket name from CloudFormation stack
Write-Host "2. Retrieving S3 bucket name from CloudFormation..."
$BucketName = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' `
    --output text

if ([string]::IsNullOrEmpty($BucketName)) {
    Write-Error "Could not retrieve S3 bucket name. Is the stack deployed?"
    exit 1
}

Write-Host "S3 Bucket: $BucketName"
Write-Host ""

# 3. Clear S3 bucket (optional - uncomment to enable)
# Write-Host "3. Clearing S3 bucket..."
# aws s3 rm s3://$BucketName --recursive --region $Region

# 4. Upload to S3
Write-Host "3. Uploading files to S3..."

# Upload .next/static (static assets - cache for 30 days)
if (Test-Path ".next/static") {
    Write-Host "  Uploading .next/static..."
    aws s3 sync .next/static `
        "s3://$BucketName/_next/static" `
        --region $Region `
        --cache-control "max-age=2592000" `
        --delete
}

# Upload public (public assets - cache for 30 days)
if (Test-Path "public") {
    Write-Host "  Uploading public..."
    aws s3 sync public `
        "s3://$BucketName/public" `
        --region $Region `
        --cache-control "max-age=2592000" `
        --delete
}

# Upload HTML files (no cache)
Write-Host "  Uploading HTML files..."
Get-ChildItem ".next" -Filter "*.html" -Recurse | ForEach-Object {
    $RelativePath = $_.FullName -replace [regex]::Escape("$(Get-Location)\.next\"), ""
    aws s3 cp `
        $_.FullName `
        "s3://$BucketName/$RelativePath" `
        --region $Region `
        --cache-control "no-cache" `
        --content-type "text/html; charset=utf-8"
}

# Upload index.html to root
Write-Host "  Uploading index.html to root..."
if (Test-Path ".next/server/app/page.html") {
    aws s3 cp `.next/server/app/page.html` `
        "s3://$BucketName/index.html" `
        --region $Region `
        --cache-control "no-cache" `
        --content-type "text/html; charset=utf-8"
}

Write-Host "Upload completed!"
Write-Host ""

# 5. Get CloudFront distribution ID
Write-Host "4. Invalidating CloudFront cache..."
$DistributionId = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' `
    --output text

if ($DistributionId) {
    aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths "/*" `
        --region $Region
    Write-Host "CloudFront cache invalidated!"
} else {
    Write-Host "Warning: Could not find CloudFront distribution ID"
}

Write-Host ""
Write-Host "Deployment completed successfully!"
Write-Host ""

# 6. Get custom domain
$CustomDomain = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`CustomDomainName`].OutputValue' `
    --output text

Write-Host "Frontend is now available at: https://$CustomDomain"
