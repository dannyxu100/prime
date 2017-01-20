'use strict';

//自定义类插件
(function(Prime, win, doc, undefined){
	//局部变量
	
	
	//插件类
	//模板引擎类
	var Plunger = (function(win, doc, undefined){
		var setting = {
			evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,				//{{ }} 动态执行
			interpolate: /\{\{=([\s\S]+?)\}\}/g,					//{{= }} 插入值
			encode:      /\{\{!([\s\S]+?)\}\}/g,					//
			use:         /\{\{#([\s\S]+?)\}\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			varname:	"it",
			strip:		true,
			append:		true,
			selfcontained: false,
			doNotSkipEncoded: false
		},
		startend = {
			append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
			split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML(" }
		}, 
		skip = /$^/,
		_globals = win;

		//数据嵌入
		function resolveDefs(c, block, def) {
			return ((typeof block === "string") ? block : block.toString())
			.replace(c.define || skip, function(m, code, assign, value) {
				if (code.indexOf("def.") === 0) {
					code = code.substring(4);
				}
				if (!(code in def)) {
					if (assign === ":") {
						if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
							def[code] = {arg: param, text: v};
						});
						if (!(code in def)) def[code]= value;
					} else {
						new Function("def", "def['"+code+"']=" + value)(def);
					}
				}
				return "";
			})
			.replace(c.use || skip, function(m, code) {
				if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
					if (def[d] && def[d].arg && param) {
						var rw = (d+":"+param).replace(/'|\\/g, "_");
						def.__exp = def.__exp || {};
						def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
						return s + "def.__exp['"+rw+"']";
					}
				});
				var v = new Function("def", "return " + code)(def);
				return v ? resolveDefs(c, v, def) : v;
			});
		}

		//构造函数
		function Plunger(){
			return;
		}
		//模板处理
		Plunger.template = function( tmpl, opt, def ) {
			opt = opt || setting;
			var cse = opt.append ? startend.append : startend.split, 
				needhtmlencode, 
				sid = 0, 
				indv,
			str  = (opt.use || opt.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

			str = ("var out='" + (opt.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ").replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,"") : str)
			.replace(/'|\\/g, "\\$&")
			.replace(opt.interpolate || skip, function(m, code) {
				return cse.start + unescape(code) + cse.end;
			})
			.replace(opt.encode || skip, function(m, code) {
				needhtmlencode = true;
				return cse.startencode + unescape(code) + cse.end;
			})
			.replace(opt.conditional || skip, function(m, elsecase, code) {
				return elsecase ?
				(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
				(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
			})
			.replace(opt.iterate || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
				return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
				+vname+"=arr"+sid+"["+indv+"+=1];out+='";
			})
			.replace(opt.evaluate || skip, function(m, code) {
				return "';" + unescape(code) + "out+='";
			}) + "';return out;")
			.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
			.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
			//.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

			if (needhtmlencode) {
				if (!opt.selfcontained && _globals && !_globals._encodeHTML){
						_globals._encodeHTML = doT.encodeHTMLSource(opt.doNotSkipEncoded);
				}
				str = "var encodeHTML = typeof _encodeHTML !== 'undefined' ? _encodeHTML : ("
				+ doT.encodeHTMLSource.toString() + "(" + (opt.doNotSkipEncoded || '') + "));"
				+ str;
			}
			
			try {
				return new Function(opt.varname, str);
			} catch (e) {
				/* istanbul ignore else */
				if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
				throw e;
			}
		};

		return Plunger;
	})(win, doc);
	
	
	
	
	//扩展原型
	// Prime.__struct__.extend({
		// plugin1: PluginName
	// });
	
	//扩展类静态成员
	// Prime.extend({
		// pluginhander: function(){
			// var p = Prime();
			// TODO:
			
			// return p.plugin1();
		// }
	// });
	
})(Prime, window, document);