'use strict';

//自定义类插件
(function(prime, win, doc, undefined){
	//局部变量
	
	
	//插件类
	var EventEmitter = (function(win, doc, undefined){
		
		//构造函数
		function EventEmitter(){
			return;
		}
		
		var manager = (function () {
			var map = {};
			//事件监听器查询匹配函数
			//fn回调函数返回false, 可中断循环
			var findall = function (elem, type, orig, handler, root, fn) {
				var prefix = root ? 'r' : '$';		//普通监听器加$前缀，根监听器加r前缀
				if ( !type || type == '*' ) {		//查询所有监听器
					for ( var t in map ) {
						if (t.charAt(0) == prefix) {
							findall(elem, t.substr(1), orig, handler, root, fn);
						}
					}
				} else {
					var list = map[prefix + type], 
						all = (elem == '*'),
						i = 0,
						len = list.length;
						
					if ( !list ) {
						return;
					}
					for ( ; i < len; i++ ) {
						if ( (all || list[i].matches(elem, orig, handler)) && !fn(list[i], list, i, type) ) {
							return;
						}
					}
				}
			};
			return {
				has: function (elem, type, orig, root) {
					var i, list = map[(root ? 'r' : '$') + type];
					if (list) {
						for (i = list.length; i--;) {		//执行循环提高效率
							if ( !list[i].root && list[i].matches(elem, orig, null) ) {
								return true;
							}
						}
					}
					return false;
				},
				get: function (elem, type, orig, root) {
					var entries = [];
					findall(elem, type, orig, null, root, function (entry) {
						return entries.push(entry);
					});
					return entries;
				},
				put: function (entry) {
					var has = !entry.root && !this.has(entry.elem, entry.type, null, false),
						key = (entry.root ? 'r' : '$') + entry.type,
						(map[key] || (map[key] = [])).push(entry);
					return has;
				},
				del: function (entry) {
					findall(entry.elem, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
						list.splice(i, 1);
						entry.removed = true;
						if (list.length === 0) {
							delete map[(entry.root ? 'r' : '$') + entry.type];
						}
						return false;
					})
				},
				entries: function () {			//获取所有entry
					var t, entries = [];
					for (t in map) {
						if (t.charAt(0) == '$') {
							entries = entries.concat(map[t]);
						}
					}
					return entries;
				}
			};
		}());
		
		
		return EventEmitter;
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