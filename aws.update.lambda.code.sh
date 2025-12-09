#!/bin/bash

# Delete zip file
# output=$(rm -f ./sf-i-events-backend.zip)
# echo "$output"
# Create a zip file
output=$(zip -r ./sf-i-uploader-backend.zip ./*)
echo "$output"

output=$(aws lambda update-function-code --function-name F_sf-i-uploader_FlaggGRC-ComplianceUploads_1684321396854_test --zip-file fileb://sf-i-uploader-backend.zip)
echo "$output"

output=$(rm ./sf-i-uploader-backend.zip)
echo "$output"