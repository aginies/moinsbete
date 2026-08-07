#!/bin/bash

# ==============================================================================
# EDIT THESE THREE VARIABLES BEFORE RUNNING THE SCRIPT!
# ==============================================================================
OLD_EMAIL="aginies@suse.com"
CORRECT_NAME="Antoine Ginies"
CORRECT_EMAIL="moinsbete@guibo.com"
# ==============================================================================

git filter-branch --env-filter '
if [ "$GIT_COMMITTER_EMAIL" = "'"$OLD_EMAIL"'" ]
then
    export GIT_COMMITTER_NAME="'"$CORRECT_NAME"'"
    export GIT_COMMITTER_EMAIL="'"$CORRECT_EMAIL"'"
fi
if [ "$GIT_AUTHOR_EMAIL" = "'"$OLD_EMAIL"'" ]
then
    export GIT_AUTHOR_NAME="'"$CORRECT_NAME"'"
    export GIT_AUTHOR_EMAIL="'"$CORRECT_EMAIL"'"
fi
' --tag-name-filter cat -- --branches --tags

echo ""
echo "Done! Please verify your commit history using 'git log'."
echo "If everything looks correct, force push using:"
echo "  git push --force --tags origin 'refs/heads/*'"
