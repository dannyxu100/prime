'use strict';

//自定义类模板
(function( win, doc, undefined ){
	//临时变量
	
	
	
	var MyClass = (function(){
		
		//构造函数
		var MyClass = function( setting ){
			return new MyClass.struct.init( setting );
		};

		MyClass.struct = MyClass.prototype = {
			//成员属性
			ver: "1.0",
			
			//成员函数
			init: function( setting ){
				setting = this.setting = da.extend( {}, this.setting, setting );
			}
		};
		MyClass.struct.init.prototype = MyClass.prototype;			//模块通过原型实现继承属性
		
		
		//类静态成员
		
		
		return MyClass;
	})();

	win.myclass = MyClass;

})(window, document);