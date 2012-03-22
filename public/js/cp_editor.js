// A Wrapper around the Code Mirror Editor
// Simplifies interactions with the editor for the rest of the application
// Encapsulates behaviors not native for our editors
function CPEditor(type, value) {
    this.editor = '';
    
    this.buildEditor(type, value);
    
    this.getOption = function(option) {
        return this.editor.getOption(option);
    };

    this.getValue = function() {
        return this.editor.getValue();
    };
    
    
};

var ColorUtil = {
    editor: '',
    from: '',
    colorType: '', // (hex|rgb|)
    initialCh: 0, // hold onto the initial ch because it changes after we replace text
    
    regexReplace: function() { }, // (colorRegexReplace|poundRegexReplace)
    // Have ColorUtil hold onto the latest cursor coordinates
    // so that they are accessible from anonymous functions
    coordinates: '',
    
    showColorPicker: function(editor) {
        var showColorPicker = false;

        // Context for showing the color picker is right if
        // color: is to the left of the cursor or
        // # is to the left of the cursor;
        var from = editor.getCursor();
        var line = editor.getLine(from.line);
        var textToLeft = line.substring(0, from.ch);
        
        if(textToLeft.match(/color:\s{0,}/i)) {
            showColorPicker = true;
            this.regexReplace = this.colorRegexReplace;
        }
        else if(textToLeft.match(/\s{0,}#/i)) {
            showColorPicker = true;
            this.regexReplace = this.poundRegexReplace;
        }
        
        return showColorPicker;
    },
    
    colorRegexReplace: function(line, hex) {
        if(hex.indexOf('NaN') > -1) {
            return line;
        }
        else {
            return line.replace(/(color:\s{0,})(#[\w\d]+|)/, "$1#" + hex);
        }
    },
    
    poundRegexReplace: function(line, hex) {
        if(hex.indexOf('NaN') > -1) {
            return line;
        }
        else {
            var start = this.findClosestPound(line, this.initialCh);
            var beginOfLine = line.substring(0, start);
            var endOfLine = line.substring(start, line.length);
            endOfLine = endOfLine.replace(/(\s){0,}(#[0-9a-fA-F]{0,6})/i, "$1#" + hex);
            
            return beginOfLine + endOfLine;
        }
    },
    
    // helps up figure out which hex color to replace for situations where
    // the text on the line is "background: linear-gradient(#d12222, #2E2E2E);"
    // we find the closest # to the left of the cursor and start replacing the line there
    findClosestPound: function(line, ch) {
        for(var i = ch; i > 0; i--) {
            if(line.charAt(i) == '#') {
                return i;
            }
        }
        
        return 0;
    },
    
    getStartColor: function(line, ch) {
        var lPound = this.findClosestPound(line, ch);
        var subLine = line.substring(lPound, (lPound + 7));

        if(subLine.match(/(\s){0,}(#[0-9a-fA-F]{0,6})/i)){
            return subLine.replace(/(\s){0,}(#[0-9a-fA-F]{0,6})/i, "$2");
        }
        else {
            return '';
        }
    }
}

// Handles Auto Complete Snippets
ACSnippets = {
    snippets: {
        'html': {
            'lorem': '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.</p>',
        },
        'css': {
            'reset': "body {\n"+
                "line-height:1;\n"+
            "}\n"
        },
        'js': {
            'for': "for(var i = 0; i > Things.length; i++) {\n\tconsole.log(Things[i]);\n}"
        }
    },
    
    findSnippet: function(editor) {
        var snippetExist = false;
        
        var mode = editor.getOption('mode');
        mode = (mode == 'xml') ? 'html' : mode;
        mode = (mode == 'javascript') ? 'js' : mode;
        
        var from = editor.getCursor();
        var line = editor.getLine(from.line);
        var textToLeft = line.substring(0, from.ch).trim();
        
        for(var key in this.snippets[mode]) {
            var negIndex = key.length * -1;
            
            if(textToLeft.substr(negIndex) == key) {
                snippetExist = this.snippets[mode][key];
                break;
            }
        }
        
        return snippetExist;
    }
}

CPEditor.prototype.buildEditor = function(type, value) {
    var standardConfig = {
        lineNumbers  : true,
        value        : value,
        tabSize      : 2,
        onChange     : Main.compileContent,
        // Code Mirror natively indents the entire line. We wanted it to work like
        // a standard editor where a tab (for us 2 spaces) is inserted into the 
        // current cursor position
        onKeyEvent   : function(editor, key) {
            // Initially have code mirror not ignore the key
            // if we decide to handle it then set this to true
            var cmIgnoreKey = false;
            
            if(key.keyCode == 9 && key.type == 'keydown') {
                if(!editor.somethingSelected()) {
                    var snippet = ACSnippets.findSnippet(editor);
                    var from = editor.getCursor();
                    
                    if(snippet) {
                        editor.setLine(from.line, snippet);
                    }
                    else {
                        var line = editor.getLine(from.line);
                        var to = {'line': from.line, 'ch': line.length};
                        var range = editor.getRange(from, to);
                        var tab = '';
                        
                        for(var i = editor.getOption('tabSize'); i > 0 ; i--) {
                            tab += ' ';
                        }
                        
                        editor.replaceRange(tab + range, from, to);
                        
                        var endCursor = from.ch + tab.length;
                        editor.setCursor({'line': from.line, 'ch': endCursor});
                    }
                    
                    // Stop the keydown and keypress both
                    key = $.Event(key);
                    key.stopPropagation();
                    key.preventDefault();
                    
                    cmIgnoreKey = true;
                }
            }
            // If the User selects the alt key and text is selected
            // replace the text with a color value from the color picker
            else if(key.keyCode == 18 && key.type == 'keydown') {
                if(ColorUtil.showColorPicker(editor)) {
                    ColorUtil.editor = editor;
                    ColorUtil.from = editor.getCursor();
                    // ColorUtil needs to hold onto the initial ch where the cursor
                    // started because it will change after we replace text
                    ColorUtil.initialCh = ColorUtil.from.ch;
                    ColorUtil.coordinates = editor.
                        charCoords({'line': ColorUtil.from.line, 'ch':0}, 'page');
                    ColorUtil.startColor = ColorUtil.
                        getStartColor(editor.getLine(ColorUtil.from.line), ColorUtil.from.ch);
                    
                    $('#tcolor').ColorPicker({
                        color: ColorUtil.startColor,
                        onShow: function (colpkr) {
                            var coordinates = ColorUtil.coordinates;
                            $(this).ColorPickerSetColor(ColorUtil.startColor);
                            
                            $(colpkr).css({
                                // index has to be more than the editors when expanded
                                // editors z-index values is 1001
                                'z-index': 1002,
                                position: 'absolute',
                                left: Math.ceil(coordinates.x) + 'px', 
                                top:  Math.ceil((coordinates.y + 15)) + 'px',
                            });
                            
                            $(colpkr).fadeIn(300);
                            
                            return false;
                        },
                        
                        onHide: function (colpkr) {
                            $(colpkr).fadeOut(300);
                            
                            return false;
                        },
                        
                        onChange: function (hsb, hex, rgb) {
                            var from = ColorUtil.editor.getCursor();
                            var line = ColorUtil.editor.getLine(from.line);
                            var newLine = ColorUtil.regexReplace(line, hex);
                            
                            ColorUtil.editor.setLine(from.line, newLine);
                        }
                    });
                         
                    $('#tcolor').click();
                }
            }

            return cmIgnoreKey;
        },
    }

    if(type == 'html') {
        standardConfig['mode'] = 'xml';
        this.editor = CodeMirror.fromTextArea($('#html')[0], standardConfig);
        this.editor.setValue(value);
    }
    else if(type == 'css') {
        standardConfig['mode'] = 'css';
        this.editor = CodeMirror.fromTextArea($('#css')[0], standardConfig);
        this.editor.setValue(value);
    }
    else if(type == 'js') {
        standardConfig['mode'] = 'javascript';
        this.editor = CodeMirror.fromTextArea($('#js')[0], standardConfig);
        this.editor.setValue(value);
    }
};

CPEditor.prototype.refresh = function() {
    this.editor.refresh();
};

CPEditor.prototype.setCursorToEnd = function() {
    this.editor.focus();

    var text = this.editor.getValue();
    
    // set the cursor to the end of the editor
    // Make sure it's at the end by line num and char num to
    // same value as the actual number of chars, CodeMirror will
    // simply move the cursor to the end
    this.editor.setCursor(text.length, text.length, true);
};