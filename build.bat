@echo off
:start
echo ���� 1 , ִ�б������
echo ���� 2 , �˳�
set /p start=��ѡ�� (1��2) �󰴻س���:
if "%start%"=="1" goto build
if "%start%"=="2" goto exit

:build
call lessc less/prime.less build/prime.css
call lessc --clean-css="--s1 --advanced --compatibility=ie8" less/prime.less build/prime.min.css
echo ==========================================
echo ������ɣ�
echo ==========================================
echo.
goto start

:exit
exit