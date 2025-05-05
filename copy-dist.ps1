# Create the public directory if it doesn't exist
New-Item -Path "hostinger-deploy\public" -ItemType Directory -Force

# Copy all files from dist to public
Copy-Item -Path "dist\*" -Destination "hostinger-deploy\public" -Recurse -Force

Write-Host "Files copied successfully from dist to hostinger-deploy\public"
