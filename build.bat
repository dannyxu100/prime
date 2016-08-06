@echo off
call lessc less/prime.less build/prime.css
call lessc --clean-css="--s1 --advanced --compatibility=ie8" less/prime.less build/prime.min.css
echo ±àÒëÍê³É£¡& pause
exit