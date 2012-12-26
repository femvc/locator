'use strict';
//   __  __    ______    ______   __    __   ______    __  __    ____                     _____      
//  /\ \/\ \  /\  _  \  /\__  _\ /\ \  /\ \ /\  _  \  /\ \/\ \  /\  _`\         /'\_/`\  /\  ___\    
//  \ \ \_\ \ \ \ \_\ \ \/_/\ \/ \ `\`\\/'/ \ \ \_\ \ \ \ `\\ \ \ \ \_\_\      /\      \ \ \ \___ 
//   \ \  _  \ \ \  __ \   \ \ \  `\ `\ /'   \ \  __ \ \ \ , ` \ \ \ \___      \ \ \_/\_\ \ \ \ __\  
//    \ \ \ \ \ \ \ \/\ \   \_\ \__ `\ \ \    \ \ \/\ \ \ \ \`\ \ \ \ \/, \  __ \ \ \\ \ \ \ \ \____
//     \ \_\ \_\ \ \_\ \_\  /\_____\  \ \_\    \ \_\ \_\ \ \_\ \_\ \ \____/ /\_\ \ \_\\ \_\ \ \_____/
//      \/_/\/_/  \/_/\/_/  \/_____/   \/_/     \/_/\/_/  \/_/\/_/  \/___/  \/_/  \/_/ \/_/  \/____/ 
//                                                                                         
/*
 * BUI(Baidu UI Library)
 * Copyright 2011 Baidu Inc. All rights reserved.
 *
 * path:    demo.js
 * desc:    BUI是一个富客户端应用的前端MVC框架[源于ER框架]
 * author:  Baidu FE
 * date:    2012/01/01 [用python脚本自动维护]
 */

var bui = {};
window.bui = bui;
/** 
 * 为对象绑定方法和作用域
 * @param {Function|String} handler 要绑定的函数，或者一个在作用域下可用的函数名
 * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
 * @param {args* 0..n} args 函数执行时附加到执行时函数前面的参数
 *
 * @returns {Function} 封装后的函数
 */
bui.fn = function(func, scope){
    if(Object.prototype.toString.call(func)==='[object String]'){func=scope[func];}
    if(Object.prototype.toString.call(func)!=='[object Function]'){ throw 'Error "bui.fn()": "func" is null';}
    var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
    return function () {
        var fn = '[object String]' == Object.prototype.toString.call(func) ? scope[func] : func,
            args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
        return fn.apply(scope || fn, args);
    };
};

/**
 * Location变化监听器
 * 
 * @引用依赖: 无
 * @对外接口: bui.Locator.onredirect();
 * @默认调用外部接口: bui.Controller.forward();
 *
 * @desc
 *      Locator = [ path ] [ ~ query ]
 *      path    = "/" [ *char *( "/" *char) ]
 *      query   = *qchar
 *      char    = ALPHA | DIGIT
 *      qchar   = char | "&" | "="
 */
bui.Locator = {
    //默认首次进入的路径
    DEFAULT_INDEX:'/',
    currentLocation:null,
    CONTROL_IFRAME_ID : 'ERHistroyRecordIframe' + String(Math.random()).replace('.',''),
    CONTROL_IFRAME_URL: 'history.html',
    IFRAME_CONTENT  : '<html><head></head><body><input type="text" id="save">'
            + '<script type="text/javascript">'
            + 'var loc = "#{0}";'
            + 'document.getElementById("save").value = loc;'
            + 'parent.bui.Locator.updateLocation(loc);'
            + 'parent.bui.Locator.switchToLocation(loc);'
            + '<'
            + '/script ></body></html>',
    inited: false,
    /**
     * 获取location信息
     * 
     * @public
     * @return {string}
     */
    getLocation: function () {
        var hash;

        // firefox下location.hash会自动decode
        // 体现在：
        //   视觉上相当于decodeURI，
        //   但是读取location.hash的值相当于decodeURIComponent
        // 所以需要从location.href里取出hash值
        if ( /firefox\/(\d+\.\d+)/i.test(navigator.userAgent) ? + RegExp['\x241'] : undefined ) {
            hash = location.href.match(/#(.*)$/);
            hash && (hash = hash[ 1 ]);
        } else {
            hash = location.hash;
        }

        if ( hash ) {
            return hash.replace( /^#/, '' );
        }
        
        return '';
    },
    /**
     * 更新hash信息
     *
     * @private
     * @param {string} loc
     */
    updateLocation: function( loc ) {
        var me = this,
            isChange = (me.currentLocation != loc);
        
        // 存储当前信息
        // opera下，相同的hash重复写入会在历史堆栈中重复记录
        // 所以需要getLocation来判断
        if ( me.currentLocation != loc && me.getLocation() != loc ) {
            location.hash = loc;
        }
        
        me.currentLocation = loc;
        return isChange;
    },
    /**
     * 控制定位器转向
     * 
     * @public
     * @param {string} loc location位置
     * @param {Object} opt_option 转向参数
     */
    redirect: function( loc, opt_option ) {
        var me = bui.Locator,
            opt = opt_option || {},
            hisList,
            histotry = document.getElementById('histotry');        
        
        if(!window.hisList) {
            window.hisList = [];
        }
        hisList = window.hisList;
        hisList.push(loc);
        
        if (histotry){
            histotry.innerHTML = hisList.join('<br/>');
        }
        
        // 非string不做处理
        if ( typeof loc != 'string' ) {
            return;
        }
        
        // 增加location带起始#号的容错性
        // 可能有人直接读取location.hash，经过string处理后直接传入
        loc = loc.replace( /^#/, '' );
        
        // 空string当成DEFAULT_INDEX处理
        if ( loc.length == 0 ) {
            loc = me.DEFAULT_INDEX; 
        }
        
        // 与当前location相同时不进行route
        var isLocChanged = me.updateLocation( loc );
        if ( isLocChanged || opt.enforce ) {
            loc = me.currentLocation;

            // 触发onredirect事件
            me.onredirect(loc);
            
            // 当location未变化，强制刷新时，直接route
            if ( isLocChanged == false ) {
                bui.Locator.switchToLocation( loc );
            } else {
                //location被改变了,非强制跳转
                me.doRoute( loc );
            }
        }
    },
    doRoute: function( loc ) {
        var me = this;
        // 权限判断以及转向
        var loc302 = me.authorize( loc );
        if ( loc302 ) {
            me.redirect( loc302 );
            return;
        }

        // ie下使用中间iframe作为中转控制
        // 其他浏览器直接调用控制器方法
        var ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || + RegExp['\x241']) : undefined;
        if ( ie && ie < 8 ) {
            me.ieRoute( loc );
        } 
        else {
            me.switchToLocation( loc );
        }
    },
    /**
     * Location变化内部调用接口
     * 
     * @private
     */
    switchToLocation: function(loc){
        
        if (typeof bui != 'undefined' && bui.Controller && bui.Controller.forward) {
            bui.Controller.forward( loc );
        }
    },
    /**
     * 外部接口
     * 
     * @public
     */
    'onredirect': new Function(),
    /**
     * 刷新当前地址
     * 
     * @public
     */
    'reload': function() {
        var me = this;
        if ( me.currentLocation ) {
            me.redirect( me.currentLocation, { enforce : true } );
        }
    },
    /**
     * IE下调用router
     * 
     * @private
     * @param {string} loc 地址, iframe内容字符串的转义
     */
    ieRoute: function( loc ) {
        var me = this;
        var iframe = document.getElementById(me.CONTROL_IFRAME_ID),
            iframeDoc = iframe.contentWindow.document;

        iframeDoc.open( 'text/html' );
        iframeDoc.write(
            me.IFRAME_CONTENT.replace('#{0}',
            String(loc).replace( /\\/g, "\\\\" ).replace( /\"/g, "\\\"" )));
        iframeDoc.close();
        
    },
    /**
     * 初始化locator
     *
     * @private
     */
    init: function() {
        var me = this,
            ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || + RegExp['\x241']) : undefined;
        if( ie && ie < 8 ){
            me.ieCreateIframeRecorder();
            window.setInterval( function(){me.changeListener();}, 100 );
        } else if ( 'onhashchange' in window ) {
            window.onhashchange = function(args){me.changeListener(args);};
            me.changeListener();
        } else {
            window.setInterval( function(){me.changeListener();}, 100 );
        }
    },
    /**
     * hash变化的事件监听器
     *
     * @private
     */
    changeListener: function() {
        var me = this,
            loc = me.getLocation();

        if ( !loc && !me.currentLocation ) {
            me.redirect( me.DEFAULT_INDEX );
        } else if ( loc && me.updateLocation( loc ) ) {
            me.doRoute( loc );
        }
    },    
    /**
     * ie下创建记录与控制跳转的iframe
     *
     * @private
     */
    ieCreateIframeRecorder: function() {
        var me = this;
        var iframe = document.createElement('iframe'),
            size   = 200,
            pos    = '-1000px';

        iframe.id       = me.CONTROL_IFRAME_ID;
        iframe.width    = size;
        iframe.height   = size;
        iframe.src      = "about:blank";

        iframe.style.position   = "absolute";
        iframe.style.top        = pos;
        iframe.style.left       = pos;

        document.body.appendChild(iframe);
    },
    /**
     * 权限规则列表
     *
     * @public
     */
    authorizers : [],
    /**
     * 增加权限验证器
     *
     * @public
     * @param {Function} authorizer 验证器，验证失败时验证器返回转向地址
     */
    addAuthorizer: function( authorizer ) {
        var me = this;
        if ( 'function' == typeof authorizer ) {
            me.authorizers.push( authorizer );
        }
    },
    /**
     * 权限验证
     *
     * @inner
     * @return {string} 验证失败时验证器返回转向地址
     */
    authorize: function( currLoc ) {
        var me = this,
            loc, 
            i, 
            len = me.authorizers.length;

        for (i = 0; i < len; i++ ) {
            loc = me.authorizers[ i ]( currLoc );
            if ( loc ) {
                return loc;
            }
        }
    }
};