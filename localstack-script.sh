#!/bin/bash
awslocal sqs create-queue --queue-name $SQS_QUEUE_NAME --region $AWS_REGION