'use strict';

(function(win, doc, undefined){
	//局部变量
	var slice = [].slice,
		push = [].push,
		isArray = Array.isArray || function(obj){ return obj instanceof Array };
	
	var regxready = /complete|loaded|interactive/,			//页面元素加载进度状态
		regxtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;	//确保去除 BOM 和 &nbsp;
		
	function isarray(target){
		return Object.prototype.toString.call(target) === '[object Array]';
	}
	function isnumber(target){
		return typeof (target) === 'number';
	}
	function isstring(target){
		return typeof (target) === 'string';
	}
	function isfunction(target){
		return typeof (target) === 'function';
	}
	function iswindow(target){
		return target !== null && target === target.window;
	}
	function isdocument(target){
		return target !== null && target.nodeType === target.DOCUMENT_NODE;
	}
	function isobject(target){
		return type(target) === 'object';
	}
	function isplainobject(target){
		return isobject(target) 
		&& !iswindow(target) 
		&& Object.getPrototypeOf(target) === Object.prototype;
	}
	function extend(target, source, deep) {
		for (var key in source){
			if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
				if (isPlainObject(source[key]) && !isPlainObject(target[key])){
					target[key] = {};
				}
				if (isArray(source[key]) && !isArray(target[key])) {
					target[key] = []
					extend(target[key], source[key], deep);
				}
			}
			else if (source[key] !== undefined){
				target[key] = source[key];
			}
		}
	}
	//队列缓存对象生产器（返回一个缓存区对象）
	function createcache(maxlen){
		var keys = [];
		function cache( key, value ){
			if( keys.push[ key+' ' ] > maxlen ){		//key加一个空格符，与原型属性做一下区分，避免原型属性被修改
				delete cache[ keys.shift() ];
			}
			return ( cache[ key+' ' ] = value );
		}
		return cache;
	}

	
	//定义类
	var Prime = (function(){
		//构造函数
		var Prime = function(callback){
			return new Prime.__struct__.init(callback);
		};
		
		//类原型
		Prime.__struct__ = Prime.prototype = {
			//成员属性
			prime: 'Prime 1.0',
			constructor: Prime,
			length: 0,
			
			//成员函数
			init: function(callback){
				if (isfunction(callback)){				//页面dom加载完毕回调
					return this.ready(callback)
				}
				return this;
			},
			ready: function(callback){
				if (regxready.test(document.readyState) && document.body){		// 兼容ie浏览器
					callback(Prime);
				}
				else {
					document.addEventListener('DOMContentLoaded', function(){ 
						callback(Prime);
					}, false);
				}
				return this;
			},
			extend: function(source){
				Prime.extend.call(this, source);
			},
			pushstack: function( elems ) {
				var ret = Prime.merge( this.constructor(), elems );
				// Add the old object onto the stack (as a reference)
				ret.prevObject = this;
				// Return the newly-formed element set
				return ret;
			}
		};
		
		
		//类静态成员
		// Prime.create = function(callback){
			// return new Prime.__struct__.init(callback);
		// };
		Prime.extend = function(target){						//属性扩展函数
			var isdeep = false,
				list = slice.call(arguments, 1);
			
			if (typeof target === 'boolean') {
				isdeep = target
				target = list.shift()
			}
			if (1===arguments.length) {					//只传一个参数，默认扩展自己
				list = slice.call(arguments);
				target = this;
			}
			for(var i=0; i<list.length; i++){
				extend(target, list[i], isdeep);
			}
			
			return target;
		};
		
		
		//扩展类静态成员
		Prime.extend({
			setting: {					//默认配置
				log: false,
				error: false
			},
			config: function( setting ){				//配置函数
				Prime.extend(Prime.setting, setting);
			},
			
			log: function( msg ) {						//统一入口控制台输出
				if( Prime.setting.log ){
					console.log( '> ' + msg );
				}
			},
			error: function( type, msg ) {				//统一入口异常抛出
				if( Prime.setting.error ){
					throw new Error( type +'：'+ msg );
				} else {
					Prime.log( msg );
				}
			},
			trim: function( text ) {
				return text == null ? '' : (text + '').replace(regxtrim, '');
			},
			createcache: createcache,
			
			isarray: Array.isArray ? Array.isArray : isArray,
			isnumber: isnumber,
			isstring: isstring,
			isfunction: isfunction,
			iswindow: iswindow,
			isdocument: isdocument,
			isobject: isobject,
			isplainobject: isplainobject,
			
			isarrayindex: function( prop, array ) {		//用于稀疏数组for-in循环，判断传入属性是否属于数组索引类别属性
				return array.hasOwnProperty(prop) 
					&& /^0$|^[1-9]\d*$/.test(prop) 
					&& prop <= 4294967294; 				// 最大可能的索引为2^32 - 2
			},
			isarraylike: function( obj ) {				//广义数组类型判断（只要有length属性，且存在索引值）
				var length = !!obj && 'length' in obj && obj.length;

				if ( Prime.isfunction(obj) || Prime.iswindow( obj ) ) {
					return false;
				}

				return Prime.isarray(obj) 
					|| length === 0 
					|| Prime.isnumber(length) && length > 0 && ( length - 1 ) in obj;
			},
			makearray: function( source, target ) {
				var res = target || [];

				if ( source != null ) {
					if ( Prime.isarraylike( Object(source) ) ) {
						Prime.merge( res, Prime.isstring(source) ? [ source ] : source );
					} else {
						push.call( res, source );
					}
				}

				return res;
			},
			merge: function( target, source ) {
				var len = +source.length,
					j = 0,
					i = target.length;

				for ( ; j < len; j++ ) {
					target[ i++ ] = source[ j ];
				}

				target.length = i;

				return target;
			}
		});
		
		Prime.__struct__.init.prototype = Prime.prototype;			//模块通过原型实现继承属性
		
		return Prime;
	})();
	
	
	//声明类
	win.Prime = Prime;
	win.$ === undefined && (win.$ = Prime)		//定义别名(避免混淆，其实并不建议用别名，不过确实挺方便，ps:难道是巧合吗？美元符号是键盘上仅剩的可用特殊符号~~~输入也快捷~~~)
	
})(window, document);