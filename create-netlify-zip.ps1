# Create a ZIP file of the Netlify deployment files
Compress-Archive -Path "netlify.toml", "netlify", "supabase-setup.sql", "NETLIFY_DEPLOY.md" -DestinationPath "gudang-mitra-netlify.zip" -Force

Write-Host "ZIP file created: gudang-mitra-netlify.zip"
