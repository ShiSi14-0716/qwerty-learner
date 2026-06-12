@echo off
title Qwerty Learner Local Server

cd /d C:\Users\施思\qwerty-learner

echo =========================
echo 启动本地服务器
echo =========================

start "" cmd /k "npm run dev"

echo 等待服务器启动...
timeout /t 4 >nul

echo 打开浏览器...
start msedge.exe http://localhost:5173

echo 完成