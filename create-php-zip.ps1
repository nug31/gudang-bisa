# Create a ZIP file of the hostinger-php directory
Compress-Archive -Path "hostinger-php\*" -DestinationPath "gudang-mitra-php.zip" -Force

Write-Host "ZIP file created: gudang-mitra-php.zip"
