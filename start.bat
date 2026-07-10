@echo off
title DECRYPT TEBEX
if not exist config.json (
  echo Copie config.example.json para config.json e configure o banco.
  pause
  exit /b 1
)
call npm start
