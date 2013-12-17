
# BRIEF INTRODUCTION TO VIM

This is only a brief introduction to VIM, for more information please Google or refer to the *references* at the end of this introduction.

## WHY

The learning curves of VIM is terribly [steep][0]. Since we already have so many great editors, why should we spend so much time learning VIM. Because ...:

### Why Others (UtralEdit, notepad++, source insight) Compared To VS
1. Light, fast
2. Features
    Highlight
    Alignment
    Fold
    Line number
    Tab
    Hex
    Column editor
    Comment
    Space replaces tab
    Search, replace and counts
    Recover
    Goto line
3. Beautiful
### VIM > modern editors

### Why **NOT** UtralEdit, notepad++, (source insight)
1. Expansive
    Utraledit      : 420 yuan
    Source Insight : 2500 yuan
2. Only available on Windows
3. None or less extensible

### Build-in editor for Linux
- man page
### Philosophy
- Use least key strokes to finish the same function
### Extensible
### Reputation
- VIM is the God of editors, EMACS is God's editor
- EMACS is actually an OS which pretends to be an editor
### **Free**

## HOW
### BASIC
- vim vs emacs
- best start: [vimtutor][1]
- movement
    h, j, k, l: why? => http://news.cnblogs.com/n/141251/
    w, e, ge
    0, $
    gg, G
    zt, zz, zb
    exit
- different modes
    insert mode
        a, o, i
    normal mode
    visual mode
        v:
            vixxx: {("hello world")}
        CTRL+V
        SHIFT+V
            alignment
- copy
    yank, paste
    register
- search and replace
- split
- fold
- run command
- spell check
- vim game 
    http://vim-adventures.com/


### PLUGINS
- alignment
    goto alignment.cpp
- jump
    goto TestCase.cpp
    CTRL+], CTRL+T
    reference called, calling, definition...
- easymotion
    run: ,,w
- explorer
    run: ,e
- taglist
    goto taglist.cpp
- comment
    goto comment.*
- ctrl-P
    run: CTRL+P
- ,u
- session
- Syntastic
- Syntastic
- autocompleter
    goto autocompleter.cpp


### INTEGRATION:
- firefox
- visual studio
    viemu
- source insight


### HELP:
- google
- :help xxx


## REFERENCE
[0]: http://coolshell.cn/articles/3125.html
[1]: C:\Program%20Files%20(x86)\Vim\vim74\vimtutor.bat
- vim history
    http://arstechnica.com/information-technology/2011/11/two-decades-of-productivity-vims-20th-anniversary/
- why VIM and EMACS are called the best editors
    http://blog.csdn.net/canlets/article/details/17307657
- 7 habits for effective text editing
    http://xbeta.info/7habits-edit.htm
    http://v.youku.com/v_show/id_XMTIwNDY5MjY4.html
