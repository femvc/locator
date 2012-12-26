locator
=======

A simple browser address locator.

    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>locator - A simple browser address locator.</title>
    <script type="text/javascript" src="locator.js"></script>
    <script type="text/javascript">
    <!--
    window.onload = function() {
        //Permit check rule
        bui.Locator.addAuthorizer(function(loc){if(loc=='/aa') return '/a';});
        
        //Switch URL event
        bui.Locator.switchToLocation = function(loc){
            document.getElementById('log').innerHTML = loc;
        };
        
        //Start location monitor
        bui.Locator.init();
    };
    
    //-->
    </script>
    </head>

    <body>
        <span id="log"></span><br/>
        <a href="#/aa">aaa</a>  
        <a href="#/bbb">bbb</a>  
        <a href="#/ccc">ccc</a>  
    </body>
    
    </html>
