import { s3Client, S3_BUCKET, ListObjectsV2Command, DeleteObjectCommand } from './globals.mjs'

export const processDeleteFiles = async (key) => {
    let isTruncated = false;
    let nextToken = null;
    let allKeys = [];
    
    do {
        
        if(!isTruncated) {
            
            var command = new ListObjectsV2Command({
              Bucket: S3_BUCKET,
              Prefix: key
            });
            
        } else {
            
            command = new ListObjectsV2Command({
              Bucket: S3_BUCKET,
              Prefix: key,
              NextContinuationToken: nextToken
            });
            
        }
        
        const response = await s3Client.send(command);
        allKeys.push(...response.Contents)
    
        if(response.IsTruncated) {
            nextToken = response.NextContinuationToken;
        }
        isTruncated = response.isTruncated;
    } while (isTruncated)

    for (const file of allKeys) {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: file.Key
        });
        try{
            await s3Client.send(deleteCommand);
        }catch(err){
            console.log(err);
        }
    }
}