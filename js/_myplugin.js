'use strict';

//自定义类插件
(function(prime, win, doc, undefined){
	//局部变量
	
	
	//插件类
	var PluginName = (function(win, doc, undefined){
		
		//构造函数
		function PluginName(){
			return;
		}
		
		return PluginName;
	})(win, doc);
	
	
	
	
	//扩展原型
	prime.__struct__.extend({
		plugin1: PluginName
	});
	
	//扩展类静态成员
	prime.extend({
		pluginhander: function(){
			var p = prime();
			//TODO:
			
			return p.plugin1();
		}
	});
	
})(prime, window, document);