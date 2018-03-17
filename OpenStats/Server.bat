@echo off
title OpenStats Server.
cls
:restart
node server.js
goto restart