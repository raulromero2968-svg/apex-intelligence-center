cd C:\Users\Rawulff\OneDrive\Desktop\apex-intelligence-center
Remove-Item gh-login.log -ErrorAction SilentlyContinue
& { gh auth login --hostname github.com --git-protocol https --web 2>&1 | Tee-Object gh-login.log }
