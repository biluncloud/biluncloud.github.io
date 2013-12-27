---
layout: post
title:  我这样学习VIM - The Life Changing Editor
description: 写给同事的简单VIM教程，个人学习VIM经历
tags:   VIM, 教程, 编程, 入门
image:  hello-world.gif
---

前两天同事让我在小组内部分享一下VIM，于是我花了一点时间写了个简短的教程。虽然准备有限，但分享过程中大家大多带着一种惊叹的表情，原来编辑器可以这样强大，这算是对我多年来使用VIM的最大鼓舞吧。所以分享结束之后，将这篇简短教程整理一下作为我的第一篇Blog。

{{ more }}

搭完网站之后的第一篇文章有些兴奋，先变身话痨简单回顾一下我是如何接触到VIM的，不感兴趣的同学可以直接跳过这一部分:-)

## 写在前面：Life Changing Editor

我是一个非常**懒**的人，对于效率有着近乎执拗的追求。比如我会花2个小时来写一个脚本，然后使用这个脚本瞬间完成一个任务，而不愿意花一个小时来手工完成这项任务，从绝对时间上来说，写脚本花的时间更长，但我依然乐此不疲。

**工欲善其事，必先利其器**，折腾各种各样的软件就成为了我的一大爱好，尤其是各种人称**神器**的工具类软件，而[善用佳软][0]是这类工具的聚集地，现在我使用的很多优秀的软件都得知于此，包括VIM，所以，如果你和我一样，希望拥有众多“神器”，让工作事半功倍，可以关注此站。

第一次听说VIM已经是离开校园参加工作之后的事，那时部门内部大多使用Source Insight代替Visual Studio编写代码，大家都被它的代码管理，自动完成，代码跳转等功能所吸引，但一个领导说了句很多Vimer经常会说，至今仍让我记忆尤新的一句话：
> 世界上只有三种编辑器，EMACS、VIM和其它

我很反对这种极端的言论，使用何种工具是一个人自由，只要能发挥一个工具最大的效率就行，不应该加以约束，更不应该鄙视。话虽如此，我却阻挡不住好奇心的驱使，琢磨着到底是什么样的编辑器会拥有这样高的评价。抱着这份好奇，我搜索到了[善用佳软][0]，看到《[普通人的编辑利器——Vim](http://blog.sina.com.cn/s/blog_46dac66f010005kw.html)》，Dieken的《[程序员的编辑器——VIM](http://blog.sina.com.cn/s/blog_46dac66f010005kw.html)》，以及王垠的《[Emacs是一种信仰！世界最强编辑器介绍](http://arch.pconline.com.cn//pcedu/soft/gj/photo/0609/865628.html)》BANG……想到不久前看到的[一段话](http://wufazhuce.org/discussion/2815/one-%E4%B8%80%E4%B8%AA-vol-435)：
> 南中国的雷雨天有怒卷的压城云、低飞的鸟和小虫，有隐隐的轰隆声呜呜咽咽……还有一片肃穆里的电光一闪。那闪电几乎是一棵倒着生长的树，发光发亮的枝丫刚刚舒展，立马结出一枚爆炸的果实，那一声炸响从半空中跌落到窗前，炸得人一个激灵，杯中一圈涟漪。

这种一个激灵的感觉不仅仅局限于雷雨天。在我读完上面几篇文章之后，简单的文字亦立刻击中儃中，炸的一个激灵。从此，我对编辑器的认识被完全颠覆。

很多孩子都有一个梦想：希望能够长大之后可以身着军装，腰插手枪，头戴警帽，遇到坏人之后潇洒拔出枪，瞬间解决战斗，除暴安良，匡扶正义。我这样的程序员们也有一个梦想：希望学成之后可以像电影里黑客们一样，对着满屏幕闪烁的各种符号，双手不离键盘噼里啪啦一阵乱敲，屏幕上的符号不断滚动，就攻破了几百公里之外的某某银行的服务器，向帐户里面增加一笔天文数字，然后潇洒的离去，神不知鬼不觉，留下不知所措的孩子们的梦想——警察叔叔们。这简直构成了程序员们的终极幻想:-P。VIM的出现让我感觉离幻想更近了一步，呃，别想错了，我是指——双手不离键盘，噼里啪啦，黑客的范儿。不可否认，扮酷也是促使我学习VIM的一个重要原因:-P。

在一个激灵之后，接下来便是不可自拔的陷入VIM世界，于是网上搜索各种入门教程，\_vimrc的配置，折腾插件，研究奇巧淫技，将VIM打造成IDE。那感觉就像世界从此就只有VIM，写代码用VIM，Visual Studio用VIM，Source Insight用VIM，甚至写PDF，浏览网页都要用VIM，够折腾吧。可是像Vimer们一样，我依然折腾着，并快乐着。如今，折腾一圈之后，随着对Unix的KISS设计哲学逐渐理解与认可：**把所有简单的事情做到极致**。所以在对待VIM的态度上也有了一定的转变，不再执著的将它打造成万能的IDE，而仅仅让它将编辑功能发挥到极致，其它的事情交给其它更擅长的工具去做。**K**eep **I**t **S**imple, **S**tupid. 

在VIM的[官方网站](http://www.vim.org/)上，对每个插件的评价是这样[分类](http://www.vim.org/scripts/script.php?script_id=273)的：

- `Life Changing` 
- `Helpful`
- `Unfulfilling`

而我想将这个分类应用到使用的软件上，对于VIM，它是毫无疑问的`Life Changing`。

## 什么是VIM

以下两句对编辑器的最高评价足矣：

- VIM is the God of editors, EMACS is God's editor
- EMACS is actually an OS which pretends to be an editor

## 为什么选VIM

我们所处的时代是非常幸运的，有越来越多的[编辑器][1]，相对于[古老的VIM][2]和EMACS，它们被称为**现代**编辑器。我们来看看这两个古董有多大年纪了：

    **EMACS** : 1975 ~ 2013 = 38岁
    **VI**    : 1976 ~ 2013 = 37岁
    **VIM**   : 1991 ~ 2013 = 22岁

看到这篇文章的人有几个是比它们大的:-)

VIM的学习曲线非常陡，[这里][3]有一个主流编辑器的学习曲线对比。既然学习VIM如此之难，而**现代**编辑器又已经拥有了如此多的特性，我们为什么要花大量的时间来学习这个老古董呢？

因为...

### 为什么选其它

先来看看为什么我们会选现在所使用的编辑器？(也许很多人直接用IDE自带的编辑器，我们暂且也把它们划到编辑器的范畴内。)这里我简单列举一些程序员期望使用的编辑拥有的功能：

- 轻量级，迅速启动（相对于IDE）
- 特性
 - 语法高亮
 - 自动对齐
 - 代码折叠
 - 自动补全
 - 显示行号
 - 重定义Tab
 - 十六进制编辑
 - 列编辑模式
 - 快速注释
 - 高级搜索，替代
 - 错误恢复
 - 迅速跳转
 - Mark
- 也许，美观也是一个诉求

但是...

### 为什么**犹豫**选择它们

总有一些理由让我们一再犹豫的选择它们，或者勉强使用它们：

- 太贵：虽然知道VS很贵，但看到价格时，还是被吓了一跳
 - Visual Studio Profession 2012 : 11645元
 - UtralEdit                     : 420元
 - Source Insight                : 2500元
 - $$
 - $$
 - $$
- 不能跨平台
 - VS, SI, UE，Notepad++这些只能在Windows上使用
 - Mac上的TextMate只能运行于Mac上
- 不容易扩展

还有别的选择么？

### VIM >= sum(现代编辑器)

首先，VIM包含了上面列的所有现代编辑器的优点，并且远远多于此...

并且，VIM拥有让你不再**犹豫**的其它特性

- 无止尽的扩展：现在VIM的官方网站上已经有了[4704][5]个扩展，并且在不断增加...
- 完美的跨平台：
 - Windows : gVim
 - Linux   : 内置默认 (e.g., man page)
 - Mac     : MacVim
- 开源
- **用起来很酷**
- 最关键的，$$$**免费**$$$

废话结束，开始进入正题。

## 如何学习VIM

### VIM的基本用法

最好的入门教程非VIM自带的[vimtutor][6]莫属，它是VIM安装之后自带的简短教程，可以在安装目录下找到，只需半个小时左右的时间，就可以掌握VIM的绝大部分用法。这是迄今为止我见过的自带软件教程中最好的一个。

网上的VIM教程也非常多，我之前看的是李果正的[大家来学VIM][7]，很适合入门。

另外推荐陈皓的[简明VIM练级攻略][8]，或者创意十足的游戏[VIM大冒险][10]。

[![VIM大冒险][9]][10]

这游戏的创意实在是太赞了，打完游戏，你便掌握了VIM，这才是真正的**寓教于乐**，下面是摘自这个游戏的描述：

> VIM Adventures is an online game based on VIM's keyboard shortcuts (commands, motions and operators). It's the "Zelda meets text editing" game. It's a puzzle game for practicing and memorizing VIM commands (good old VI is also covered, of course). It's an easy way to learn VIM without a steep learning curve.

### VIM进阶：插件

在学完了上面任何一个教程之后，通过一段时间的练习，你已经可以非常熟练的使用VIM。即使是“裸奔”，VIM已经足够强大，能够完成日常的绝大部分工作。但VIM更加强大的是它的扩展机制，就像Firefox和Chrome的各种插件，它们将令我们的工具更加完美。接下来我将介绍一些非常有用的插件，看完之后，看你有何感觉。

在这开始之前，先介绍一小段VIM插件的管理方式。在我刚接触插件之时，安装一个插件需要：

1. 去官网下载
2. 解压
3. 拷贝到VIM的安装目录
4. 运行:help tags

这些步骤已经足够复杂，更加无法想象的是要更新或者删除一个插件时，因为它的文件分布在各个目录下，除非你对VIM的插件机制和要删的插件了如直掌，否则你能难将它删除干净。所以一段时间之后，VIM的安装目录下简直就是一团乱麻，管理插件几乎成为了一项不可能完成的任务。想象一下，如果Windows上面没有软件管理工具，你如何安装，卸载一个软件吧。

接下来，一个神器出现了——[Vundle][11]，再加上[GitHub][12]时代的到来，VIM插件的管理变得前所未有的简单。

#### Vundle

在按照官方的[教程][11]安装好Vundle之后，要安装一个插件时，你只需要：

1. 选好插件
2. 在VIM的配置文件中加一句 `Bundle 'you/script/name'`
3. 在VIM中运行 `:BundleInstall`

卸载时只需：

1. 去除配置文件中的 `Bundle 'you/script/name'`
2. 在VIM中运行 `:BundleClean`

更新插件就更加简单，只需一句 `:BundleUpdate` 即可。

#### ColorScheme
##########################################################{

- 整个截图

导航：
- NerdTree
- Ctrl-P
- TagList
- Tagbar

移动：
- EasyMotion

自动补全与快速编辑：
- YouCompleteMe
- UltiSnips： 去它的网站看
- tabular
- NeoCommenter
- 语法
- python-mode
- zenhtml

其它：
- undo
- 保存会话
- powerline
参考这里：
http://blog.csdn.net/wklken/article/details/9076621

##########################################################}

### 终极配置: spf13


### 与其它软件集成
- firefox
- visual studio
    viemu
- source insight

### 一些资源
- 为什么VIM使用HJKL作为方向键？请看[这里][20]
- 为什么VIM和EMACS被称为最好的编辑器？这看[这里][21]
- VIM作者的演讲：《[高效编辑的7个习惯][22]》，视频请点[这里][23]

## REFERENCE
[0]: http://xbeta.info
[1]: http://zh.wikipedia.org/wiki/%E6%96%87%E6%9C%AC%E7%BC%96%E8%BE%91%E5%99%A8%E6%AF%94%E8%BE%83
[2]: http://arstechnica.com/information-technology/2011/11/two-decades-of-productivity-vims-20th-anniversary/
[3]: http://coolshell.cn/articles/3125.html
[4]: http://news.mydrivers.com/1/241/241042.htm
[5]: http://www.vim.org/scripts/script_search_results.php
[6]: C:\Program%20Files%20(x86)\Vim\vim74\vimtutor.bat
[7]: http://www.study-area.org/tips/vim/
[8]: http://coolshell.cn/articles/5426.html
[9]: http://coolshell.cn//wp-content/uploads/2012/04/vimadventuresgamefun.jpg
[10]: http://vim-adventures.com/
[11]: https://github.com/gmarik/vundle
[12]: https://github.com/

[20]: http://news.cnblogs.com/n/141251/
[21]: http://blog.csdn.net/canlets/article/details/17307657
[22]: http://xbeta.info/7habits-edit.htm
[23]: http://v.youku.com/v_show/id_XMTIwNDY5MjY4.html