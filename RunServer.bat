@echo OFF
title TwitchBot Server.
cd OpenStats
start Server.bat
cd ..
cls
:start
node Server.js
goto start