@echo off
title Auto Copy db1.db to db.db
cd /d "%~dp0"
node copy_from_db1.js
pause
