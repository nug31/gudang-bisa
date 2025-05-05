# Create a ZIP file of the hostinger-deploy directory
Compress-Archive -Path "hostinger-deploy\*" -DestinationPath "hostinger-deploy.zip" -Force

Write-Host "ZIP file created: hostinger-deploy.zip"
