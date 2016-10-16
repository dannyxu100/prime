'use strict';

(function(Prime, win, doc, undefined){
	//临时变量
	var slice = [].slice;
	var regxfragment = /^\s*<(\w+|!)[^>]*>/;		//HTML代码片段
	
	
	
	//扩展原型
	Prime.__struct__.extend({
		finderinit: function(doms, selector){
			var len = doms ? doms.length : 0;
			for (var i = 0; i < len; i++){
				this[i] = doms[i];
			}
			this.length = len;
			this.selector = selector || '';
			
			return this;
		}
	});
	
	
	//扩展类静态成员
	Prime.extend({
		qsa: function(dom, selector){
			var res = [],
				isid = selector[0] === '#',
				isclass = selector[0] === '.',
				target = isid || isclass ? selector.slice(1) : selector;	//去掉选择器首字母标识
				
			if(isid && dom.getElementById){
				res = dom.getElementById(target);
				return res ? [res] : [];
			} else if(dom.nodeType !== 1 && dom.nodeType !== 9 && dom.nodeType !== 11){
				/*
					1	Element	代表元素
					2	Attr	代表属性
					3	Text	代表元素或属性中的文本内容
					4	CDATASection	代表文档中的 CDATA 部分（不会由解析器解析的文本）
					5	EntityReference	代表实体引用
					6	Entity	代表实体
					7	ProcessingInstruction	代表处理指令
					8	Comment	代表注释
					9	Document	代表整个文档（DOM 树的根节点）
					10	DocumentType	向为文档定义的实体提供接口
					11	DocumentFragment	代表轻量级的 Document 对象，能够容纳文档的某个部分
					12	Notation	代表 DTD 中声明的符号
				*/
				return res;
			} else if (isclass && dom.getElementsByClassName){
				res = dom.getElementsByClassName(target);
				return Prime.makearray(res);
			} else {
				res = dom.querySelectorAll(target);
				return Prime.makearray(res);
			}
		},
		finder: function(selector, context){
			var p = Prime.create();
			
			var doms;
			if (!selector){									//没有选择器，直接返回空对象
				return p;
			}
			else if (Prime.isstring(selector)) {			//选择器字符串处理
				selector = Prime.trim(selector);
				/*
				// If it's a html fragment, create nodes from it
				// Note: In both Chrome 21 and Firefox 15, DOM error 12
				// is thrown if the fragment doesn't begin with <
				if (selector[0] === '<' && regxfragment.test(selector)){
					dom = zepto.fragment(selector, RegExp.$1, context), 
					selector = null;
				}
				// If there's a context, create a collection on that context first, and select
				// nodes from there
				else if (context !== undefined){
					return $(context).find(selector);
				}
				// If it's a CSS selector, use it to select nodes.
				else{
					dom = zepto.qsa(doc, selector);
				}
				*/
				doms = Prime.qsa(doc, selector);
			}
			/*
			// If a Zepto collection is given, just return it
			else if (zepto.isZ(selector)){
				return selector
			}
			else {
				// normalize array if an array of nodes is given
				if (isArray(selector)) dom = compact(selector)
				// Wrap DOM nodes.
				else if (isObject(selector))
				dom = [selector], selector = null
				// If it's a html fragment, create nodes from it
				else if (regxfragment.test(selector))
				dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
				// If there's a context, create a collection on that context first, and select
				// nodes from there
				else if (context !== undefined) return $(context).find(selector)
				// And last but no least, if it's a CSS selector, use it to select nodes.
				else dom = zepto.qsa(doc, selector)
			}
			// create a new Zepto collection from the nodes found
			*/
			return p.finderinit(doms, selector);
		}
	});
	
})(Prime, window, document);