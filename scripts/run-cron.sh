#!/bin/bash

cd /home/aginies/devel/github/aginies/moinsbete

LOGFILE="/var/log/moinsbete-cron.log"

echo "=== Cron run started at $(date) ===" >> "$LOGFILE"

npx tsx src/scripts/run-cron.ts 2>&1 | tee -a "$LOGFILE"

EXIT_CODE=${PIPESTATUS[0]}

echo "=== Cron run exited with code ${EXIT_CODE} ===" >> "$LOGFILE"
echo "" >> "$LOGFILE"

exit $EXIT_CODE
