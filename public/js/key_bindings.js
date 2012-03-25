var KeyBindings = {
    
    init: function() {
        this.bindKeys();
    },
    
    bindKeys: function() {
        $(document).on('keydown', function(event) {

            console.log(event);

            stop = false;
            
            // Process all the altKey pressed events
            if(event.altKey) {
                if(event.keyCode == 49) {
                    // cmd + 1
                    stop = true;
                    Main.openExpandedArea('#box-html');
                    HTMLEditor.setCursorToEnd();
                    Main.refreshEditors(200);
                }
                else if(event.keyCode == 50) {
                    // cmd + 2
                    stop = true;
                    Main.openExpandedArea('#box-css');
                    CSSEditor.setCursorToEnd();
                    Main.refreshEditors(200);
                }
                else if(event.keyCode == 51) {
                    // cmd + 3
                    stop = true;
                    Main.openExpandedArea('#box-js');
                    JSEditor.setCursorToEnd();
                    Main.refreshEditors(200);
                }
                else if(event.keyCode == 13) {
                    // cmd + return
                    // compile and run code
                    stop = true;
                    CodeRenderer.compileContent(true);
                }
                else if(event.keyCode == 75) {
                    // command + K
                    // fork this project
                    // alextodo, what does fork this project mean?
                    // start with another, save to local storage?
                    // then start using that? yea
                    CData.forkData();
                    window.open('/');
                }
                else if(event.keyCode == 71) {
                    // command + g
                    // create a gist
                    stop = true;
                    CodeRenderer.createGist();
                }
                else if(event.keyCode == 83) {
                    // command + s
                    CData.save();
                    
                    stop = true;
                }
                else if(event.keyCode == 76) {
                    // command + l
                    
                    // If you've saved your code, you can open it in full page
                    // mode. Otherwise this fails silently.
                    if(document.location.pathname.match(/\/[\d]+(\/[\d]+)?/)) {
                        window.open(document.location.pathname + '/full')
                    }
                    
                }
            }
            
            if(event.keyCode == 27) {
                Main.closeExpandedAreas();
            }
            
            if(stop) {
                $.Event(event).stopPropagation();
                return false;
            }
        });
    },
};