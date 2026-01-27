#!/bin/bash

# Frontend Infrastructure Deployment Script
# Usage: ./deploy-infra.sh [environment] [domain] [certificate-arn]
# Example: ./deploy-infra.sh stage stage.mark-sports.com arn:aws:acm:ap-northeast-1:xxx

set -e

ENVIRONMENT=${1:-stage}
DOMAIN_NAME=${2:-stage.mark-sports.com}
CERTIFICATE_ARN=${3}
REGION=ap-northeast-1
STACK_NAME="ecsite-frontend-${ENVIRONMENT}"

if [ -z "$CERTIFICATE_ARN" ] && [ "$ENVIRONMENT" != "dev" ]; then
  echo "Error: CERTIFICATE_ARN is required for stage/prod environment"
  echo "Usage: $0 [environment] [domain] [certificate-arn]"
  exit 1
fi

echo "Deploying Frontend Infrastructure..."
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file infra/cloudformation.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    DomainName="$DOMAIN_NAME" \
    CertificateArn="${CERTIFICATE_ARN:-arn:aws:acm:${REGION}:000000000000:certificate/dummy}" \
  --region "$REGION" \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM

echo ""
echo "Deployment completed!"
echo ""

# Get outputs
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output table
