# prime
极简前端UI



使用说明：
prime使用less预编译模式开发。

建议通过node的npm服务进行less的命令行工具安装。

1.先安装node.js，推荐官网下载安装。
	官网地址：https://nodejs.org/en/
	
2.安装less命令行工具（这里使用全局安装）
	> npm install less -g
	
3.编译prime。（windows平台可以执行build.bat文件来编译）
	> lessc less/prime.less build/prime.css
	
4.引用build目录下的prime.css文件到你的页面，OK。