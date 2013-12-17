
# BRIEF INTRODUCTION TO VIM

This is only a brief introduction to VIM, for more information please Google or refer to the *references* at the end of this introduction.

## WHY

There are many splendid [editors][2] in our times, comparing to the old VIM and EMACS, they are called **modern** editors.

    **EMACS** : 1975 ~    = 38 years old
    **VI**    : 1976 ~    = 37 years old
    **VIM**   : 1991 ~    = 22 years old

They have plenty of modern features which make EDITING/PROGRAMMING a comfortable job. The learning curves of VIM is terribly [steep][0]. Since we already have so many great editors with such wonderful features, why should we spend so much time learning the [old][4] VIM. 

Because ...

### Why Others (UtralEdit, Notepad++ || IDEs: Source Insight, VS, Eclipse)

- Light, fast (not for IDE)
- Integrated (for IDE)
- Features
 - Highlight
 - Alignment
 - Fold
 - Line number
 - Tab
 - Hex
 - Column editor
 - Comment
 - Space replaces tab
 - Search, replace and counts
 - Recover
 - Goto line
 - Mark
- Beautiful

But...

### Why **HESITATE** Others (UtralEdit, Notepad++ || IDEs: Source Insight, VS, Eclipse)

There are always been some reason why we hesitate to use them. 

- Expansive

        MicroSoft Visual Studio 2010 Ultimate with MSDN : 110880 yuan
        Utraledit                                       : 420 yuan
        Source Insight                                  : 2500 yuan
        $_$
        $_$
        $_$

- Only Available On Windows
- None Or Bad Extensible

Other choice?

### VIM > Modern Editors

VIM has all the advantages list above. But much more then that...

- Perfect and Countless Extensions
    There are [4704][3] scripts now on the official website, more and more
- Cross Platform
    Windows : gVim
    Linux   : Build-in and Default Editor (e.g., man page)
    Mac     : MacVim
- Open Source
- $$$**FREE**$$$
- **COOL**

## WHAT

### Philosophy

- Use least key strokes to finish most functions. 

### Reputation

- VIM is the God of editors, EMACS is God's editor
- EMACS is actually an OS which pretends to be an editor

## HOW

### Basic Operations

The best tutor of VIM is: [vimtutor][1]. It's integrated in the installation package. You only need to spend less then 30 minutes to get familiar with the frequently used features. Then **practice** + **help** + **Google**. 

There is another great tutor, a [game][5]. Yes, you didn't heart by mistake. It's a game. 
> VIM Adventures is an online game based on VIM's keyboard shortcuts (commands, motions and operators). It's the "Zelda meets text editing" game. It's a puzzle game for practicing and memorizing VIM commands (good old VI is also covered, of course). It's an easy way to learn VIM without a steep learning curve.

- Movement

        h, j, k, l: [why?][5]
        w, e, b, ge
        0, $
        gg, G
        zt, zz, zb
        exit

- Different Modes
 - insert mode
        a, o, i
 - normal mode
 - visual mode
        v:
            vixxx: {("hello world")}
        CTRL+V
        SHIFT+V
            alignment
- Copy
        yank, paste
        register
- Search and replace
- Split
- Mark
- Fold
- Run command: run `:! explorer`, `:r! set path`
- Spell check: Heer is a worong worrd. 
- Auto Pair: (), [], {}, ``


### Plugins
- Alignment `goto alignment.cpp`
- Jump
    `goto TestCase.cpp`
    CTRL+], CTRL+T
    reference called, calling, definition...
- Easymotion
    run: ,,w
- Explorer
    run: ,e
- Taglist
    `goto taglist.cpp`
- Comment
    `goto comment.*`
- Ctrl-P
    run: CTRL+P
- ,u
- Session
- Syntastic
- Autocompleter
    `goto autocompleter.cpp`


### Integration
- firefox
- visual studio
    viemu
- source insight


### Help
- google
- :help xxx


## REFERENCE
[0]: http://coolshell.cn/articles/3125.html
[1]: C:\Program%20Files%20(x86)\Vim\vim74\vimtutor.bat
[2]: http://zh.wikipedia.org/wiki/%E6%96%87%E6%9C%AC%E7%BC%96%E8%BE%91%E5%99%A8%E6%AF%94%E8%BE%83
[3]: http://www.vim.org/scripts/script_search_results.php
[4]: http://arstechnica.com/information-technology/2011/11/two-decades-of-productivity-vims-20th-anniversary/
[5]: http://vim-adventures.com/
[6]: http://news.cnblogs.com/n/141251/
- why VIM and EMACS are called the best editors
    http://blog.csdn.net/canlets/article/details/17307657
- 7 habits for effective text editing
    http://xbeta.info/7habits-edit.htm
    http://v.youku.com/v_show/id_XMTIwNDY5MjY4.html
