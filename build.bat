@echo off
:start
echo 输入 1 , 执行编译操作
echo 输入 2 , 退出
set /p start=请选择 (1、2) 后按回车键:
if "%start%"=="1" goto build
if "%start%"=="2" goto exit

:build
call lessc less/prime.less build/prime.css
call lessc --clean-css="--s1 --advanced --compatibility=ie8" less/prime.less build/prime.min.css
echo ==========================================
echo 编译完成！
echo ==========================================
echo.
goto start

:exit
exit