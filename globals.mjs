const REGION = "AWS_REGION"; //e.g. "us-east-1"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { CloudWatchLogsClient, PutLogEventsCommand, GetLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { PutObjectCommand, S3Client, GetObjectAttributesCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { TextractClient, DetectDocumentTextCommand, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";

const ddbClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({});

const TABLE = "DB_TABLE_NAME";
const LOG_GROUP_NAME = "AWS_LOG_GROUP_NAME";
const S3_BUCKET = "AWS_S3_BUCKET_NAME";

const AUTH_ENABLE = true;

const RECORD_TYPE_META = "meta";
const RECORD_TYPE_DATA= "data";

const PRESERVE_LOGS_DAYS = 3;

export { 
    REGION,
    ScanCommand, 
    GetItemCommand, 
    PutItemCommand, 
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    ddbClient,
    TABLE, 
    AUTH_ENABLE, 
    PRESERVE_LOGS_DAYS,
    CloudWatchLogsClient,
    PutLogEventsCommand,
    LOG_GROUP_NAME,
    GetLogEventsCommand,
    S3_BUCKET,
    PutObjectCommand,
    s3Client,
    RECORD_TYPE_META,
    RECORD_TYPE_DATA,
    GetObjectAttributesCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    TextractClient,
    DetectDocumentTextCommand,
    StartDocumentTextDetectionCommand,
    GetDocumentTextDetectionCommand
};