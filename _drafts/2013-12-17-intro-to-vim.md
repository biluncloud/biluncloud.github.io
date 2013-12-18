---
layout: post
title:  我是这样学习VIM的
tags:   VIM
image:  hello-world.gif
---

前两天team leader突然让我在小组内部分享一下VIM，于是我花了一点时间写了个简短的教程。分享之时，大家大多带着一种惊叹的表情，原来编辑器可以这么强大，这算是对我花时间准备的最大鼓舞吧。所以分享结束之后，将这篇简短教程整理了一下，作为我的第一篇Blog。

先简单回顾一下我个人是如何接触到VIM的，不感兴趣的同学可以直接跳过这一部分:-)

## 关于我

我是一个非常**懒**的人，对于效率有着近乎执拗的追求。比如我会花2个小时来写一个脚本，然后使用这个脚本瞬间完成一个任务，而不愿意花一个小时来手工完成这项任务，从绝对时间上来说，写脚本花的时间更长，但我依然乐此不疲。

**工欲善其事，必先利其器**，折腾各种各样的软件就成为了我的一大爱好，尤其是各种人称**神器**的工具类软件，而[善用佳软][1]是这类工具的聚集地，现在我使用的很多优秀的软件都是来自于这里，包括VIM，所以，如果你和我一样，希望拥有众多“神器”，可以关注此站。

离开校园参加工作之后我才第一次听到VIM，那时部门内部都兴起了一股使用Source Insight代替Visual Studio编写代码之风，大家都被它的代码管理，自动完成，代码跳转功能所惊叹，但一个领导说了一句很多Vimer经常会说，至今让我记忆尤新的一句话：
> 世界上只有三种编辑器，EMACS、VIM和其它

虽然我很反对这种极端的言论，却阻挡不住好奇心的驱使，到底是什么样的编辑器会有着这样高的评价。抱着这份好奇，我搜索到了[善用佳软][1]，看到《[普通人的编辑利器——Vim](http://blog.sina.com.cn/s/blog_46dac66f010005kw.html)》，Dieken的《[程序员的编辑器——VIM](http://blog.sina.com.cn/s/blog_46dac66f010005kw.html)》，以及王垠的《[Emacs是一种信仰！世界最强编辑器介绍](http://arch.pconline.com.cn//pcedu/soft/gj/photo/0609/865628.html)》BANG……南方的雷雨天里，经常有一片肃穆里的电光一闪，闪电几乎是一棵倒挂天空迅速生长的树，发光发亮的枝丫刚刚舒展，立马结出一枚爆炸的果实，那一声炸响从半空中跌落到窗前，炸得人一个激灵，杯中一圈涟漪。这种激灵的感觉也出现在我读完上面两篇文章之后，虽然只是简单的介绍，却完全颠覆了我对编辑器的认识。

很多孩子都有一个梦想：希望能够长大之后可以身着军装，腰插手枪，头戴警帽，遇到坏人之后迅速潇洒拔出枪，瞬间解决战斗，匡扶正义。我这样的程序员们也有一个梦想：可以像电影里黑客们一样，对着满屏幕闪烁的各种符号，双手不离键盘噼里啪啦一阵乱敲，就攻破了几百公里之外的某某银行的服务器，向自己的帐户里面加上一笔天文数字，然后又悄无声息的离去，神不知鬼不觉。简直是酷毙了:-P。VIM的出现让我感觉离梦想更近了一步，哈哈，我是指——双手不离键盘，看起来像个黑客。不可否认，扮酷也是促使我学习VIM的一个重要原因。

激灵之后，接下来便是不可自拔的陷入VIM世界，于是网上搜索各种入门教程，\_vimrc的配置，折腾插件，研究奇巧淫技。那感觉就像世界从此就只有VIM，

This is only a brief introduction to VIM, for more information please Google or refer to the *references* at the end of this introduction.

## WHAT IS VIM

### Philosophy

- Use least key strokes to finish most functions. 

### Reputation

- VIM is the God of editors, EMACS is God's editor
- EMACS is actually an OS which pretends to be an editor

## WHY IS VIM

There are many splendid [editors][2] in our times, comparing to the old VIM and EMACS, they are called **modern** editors.

    **EMACS** : 1975 ~ 2013 = 38 years old
    **VI**    : 1976 ~ 2013 = 37 years old
    **VIM**   : 1991 ~ 2013 = 22 years old

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

### Ultimate Configuration: spf13


### Integration
- firefox
- visual studio
    viemu
- source insight


### Help
- google
- :help xxx


## REFERENCE
[1]: http://xbeta.info


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
