---
layout: post
title:  我这样学习VIM - The Life Changing Editor
description: 写给同事的简单VIM教程，个人学习VIM经历
tags:   VIM, 教程, 编程, 入门
image:  hello-world.gif
---

前两天同事让我在小组内部分享一下VIM，于是我花了一点时间写了个简短的教程。虽然准备有限，但分享过程中大家大多带着一种惊叹的表情，原来编辑器可以这样强大，这算是对我多年来使用VIM的最大鼓舞吧。所以分享结束之后，将这篇简短教程整理一下作为我的第一篇Blog。

{{ more }}

# Table of Contents

* Table of Contents Placeholder
{:toc}

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

那么，还有别的选择么？

### VIM >= SUM(现代编辑器)

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

### 一秒钟变记事本

很多时候大家希望能够以最快的速度编辑文档，而不愿意花大量的时间在学习这一工具上，比如偶尔要去Linux改变一下配置。这时VIM有一种方法可以**一秒钟变记事本**，打开VIM之后，只需要一个键`i`，接下来所有的操作就和Windows上的记事本无异，你所喜爱与习惯的方向键也回来了。

这也并没有多神奇，它只是VIM提供的一种特殊的模式：`Insert mode`，在按过`i`之后，你可以在编辑器的左下角看到`INSERT`字样。但是因为VIM无法使用`CTRL-S`来保留，那么，在编辑完之后，如何保存退出呢？也很简单，先按`ESC`，再输入`:wq`，前面一步是告诉VIM退出`INSERT`模式，后面一个命令是保存退出。

我见过很多人这样用，虽然说这很容易，但是有种暴殄天物的感觉，和给了你一把AK47，你却把它当成棍子使一样。要发挥AK47的作用，还请向下看。

### VIM的基本用法

最好的入门教程非VIM自带的[vimtutor][6]莫属，它是VIM安装之后自带的简短教程，可以在安装目录下找到，只需半个小时左右的时间，就可以掌握VIM的绝大部分用法。这是迄今为止我见过的自带软件教程中最好的一个。

当然，网上的VIM教程也非常多，我之前看的是李果正的[大家来学VIM][7]，很适合入门。

另外推荐陈皓的[简明VIM练级攻略][8]，或者创意十足的游戏[VIM大冒险][10]。

[![VIM大冒险](/img/posts/vim-adventures.jpg)][10]

这游戏的创意实在是太赞了，打完游戏，你便掌握了VIM，这才是真正的**寓教于乐**，下面是摘自这个游戏的描述：

> VIM Adventures is an online game based on VIM's keyboard shortcuts (commands, motions and operators). It's the "Zelda meets text editing" game. It's a puzzle game for practicing and memorizing VIM commands (good old VI is also covered, of course). It's an easy way to learn VIM without a steep learning curve.

最后在这里给大家分享一个vgod设计的[VIM命令图解][13]。这也是我看过的最好的命令图示，看完了前面的基本教程后，可以将它作为一个cheat sheet随时查看，相信用不了多久你也可以完全丢掉它。关于此图的详细解释可以参考[这里][13]。

[![VIM命令图解](/img/posts/vim-cmd.png)][13]

### VIM进阶：插件

在学完了上面任何一个教程之后，通过一段时间的练习，你已经可以非常熟练的使用VIM。即使是“裸奔”，VIM已经足够强大，能够完成日常的绝大部分工作。但VIM更加强大的是它的扩展机制，就像Firefox和Chrome的各种插件，它们将令我们的工具更加完美。接下来我将介绍一些非常有用的插件，看完之后，相信你一定会觉得蠢蠢欲动。

#### 插件管理神器：Vundle

在这开始之前，先简单介绍VIM插件的管理方式。在我刚接触插件之时，安装一个插件需要：

1. 去官网下载
2. 解压
3. 拷贝到VIM的安装目录
4. 运行:help tags

这些步骤已经足够复杂，更加无法想象的是要**更新**或者**删除**一个插件时，因为它的文件分布在各个目录下，就比如Windows上的`安装路径`，`Application data`，`用户数据`，`注册表`等等，除非你对VIM的插件机制和要删的插件了如直掌，否则你能难将它删除干净。所以一段时间之后，VIM的安装目录下简直就是一团乱麻，管理插件几乎成为了一项不可能完成的任务。想象一下，如果Windows上面没有软件管理工具，你如何安装，卸载一个软件吧。

但是这没有难倒聪明的VIMer们，他们利用VIM本身的特性，开发出了神器——[Vundle][11]，配合上[GitHub][12]，VIM插件的管理变得前所未有的简单。来对比一下使用Vundle如何管理插件：

在按照官方的[教程][11]安装好Vundle之后，要安装一个插件时，你只需要：

1. 选好插件
2. 在VIM的配置文件中加一句 `Bundle 'you/script/path'`
3. 在VIM中运行 `:BundleInstall`

卸载时只需：

1. 去除配置文件中的 `Bundle 'you/script/name'`
2. 在VIM中运行 `:BundleClean`

更新插件就更加简单，只需一句 `:BundleUpdate`。现在你已经完全从粗活累活中解放了出来，从此注意力只需放在挑选自己喜欢的插件上，还有比这更美好的么？下面介绍的所有的插件都以它来管理。

#### 配色方案

你是否觉得用了许多年的白底黑字有些刺眼，又或者你是否厌倦了那单调枯燥？如果是，那好，VIM提供了成百上千的[配色方案][14]，终有一款适合你。

在所有的配色当中，最受欢迎的是这款[Solarized][15]：

[![阴阳八卦](/img/posts/vim-solarized-yinyang.png)][15]

在Github上它有[4,930][16]个Star，仅靠一个`配色方案`就得到如此多的Star，可见它有多么的受欢迎。它有两种完全相反的颜色，一暗一亮，作者非常具有创意将它们设计成一个`阴阳八卦`，赏心悦目。下面是采用这种配色的VIM截图:

![Solarized截图](/img/posts/vim-solarized.png)

Solarized配色还有一个使它能够成为最受欢迎的配色方案的理由，除了VIM之外，它还提供了很多[其它软件][17]的配色方案，包括：`Emacs`, `Visual Studio`, `Xcode`, `NetBeans`, `Putty`，各种终端等等，应该是除了默认的黑白配色之外用途最为广泛的一种了。目前我采用的就是这种配色方案的dark background，它的对比度非常适合长期对着编辑器的程序员们。

还有一种很受欢迎的配色方案：[Molokai][18]，它是Mac上TextMate编辑器的一种经典配色，也非常适合程序员：

![Molokai截图](/img/posts/vim-molokai.png)

#### 导航与搜索

1. [NERDTree][19] - file navigation
![NERDTree](/img/posts/vim-the-nerd-tree.gif)

    代码资源管理器现在已经成为了各种各样IDE的标配，这可以大大提高管理源代码的效率。这样的功能VIM自然不能少，NERD Tree提供了非常丰富的功能，不仅可以以VIM的方式用键盘来操作目录树，同时也可以像Windows资源管理器一样用鼠标来操作。

    `--help:` 可以将打开目录树的功能绑定到你所喜欢的快捷键上，比如：`map <leader>e :NERDTreeToggle<CR>`

2. [CtrlP][20] - fast file finder
![CtrlP](/img/posts/vim-ctrlp.gif)

    如果说上面介绍的NERD Tree极大的方便了源代码的管理方式，那CtrlP可以称的上是革命性的，杀手级的VIM查找文件插件。它以简单符合直觉的输入方式，极快的响应速度，精确的准备度，带你在项目中自由穿越。它可以模糊查询定位，包括工程下的所有文件，已经打开的buffer，buffer中的tag以及最近访问的文件。在这之前，我用的是[lookupfiles](http://www.vim.org/scripts/script.php?script_id=1581)，因为依赖了其它的插件和应用程序，这个上古时代的插件逐渐被抛弃了。自从有了它，NERD Tree也常常被我束之高阁。
    
    据说它模仿了Sublime的名字和功能，我没用过Sublime，但是听说CtrlP这个功能是Sublime最性感的功能之一。可以去它的[官网](http://www.sublimetext.com/)看看。

    `--help:` 这个插件另一个令人称赞的一点在于无比简单直观的使用方式，正如其名：`Ctrl+P`，然后享受它带来的快感吧。

3. [Taglist][21] - source code browser
![Taglist](/img/posts/vim-taglist.png)

    想必使用过Visual Studio和Source Insight的人都非常喜爱这样一个功能：左边有一个Symbol窗口，它列出了当前文件中的宏、全局变量、函数、类等信息，鼠标点击时就会跳到相应的源代码所在的位置，非常便捷。Taglist就是实现这个功能的插件。可以说symbol窗口是程序员不可缺少的功能，当年有很多人热衷于借助taglist、ctags和cscope，将VIM打造成一个非常强大的Linux下的IDE，所以一直以来，taglist在VIM官方网站的scripts排列榜中一直高居[榜首](http://www.vim.org/scripts/script_search_results.php?keywords=&script_type=&order_by=rating&direction=descending&search=search)，成为VIM使用者的必备插件。

    `--help:` 最常见的做法也是将它绑定到一个快捷键上，比如：`map <silent> <F9> :TlistToggle<CR>`

4. [Tagbar][22] - tag generation and navigation
![Tagbar](/img/posts/vim-tagbar.gif)

    看起来Tagbar和上面介绍的Taglist很相似，它们都是展示当前文件Symbol的插件，但是两者有一定的区别，大家可以从上图的对比中得知，两者的关注点不同。总的来说Tagbar对面向对象的支持更好，它会自动根据文件修改的时间来重新排列Symbol的列表。它们以不同的纬度展示了当前文件的Symbol。

    `--help:` 同Taglist一样，可以这样绑定它的快捷键，`nmap <silent> <F4> :TagbarToggle<CR>`

5. [Tasklist](https://github.com/vim-scripts/TaskList.vim) - eclipse task list
![Tasklist](/img/posts/vim-tasklist.gif)

    这是一个非常有用的插件，它能够标记文件中的`FIXME`、`TODO`等信息，并将它们存放到一个任务列表当中，后面随时可以通过Tasklist跳转到这些标记的地方再来修改这些代码，十分方便实用。

    `--help:` 通常只需添加一个映射：`map <leader>td <Plug>TaskList`

#### 自动补全

1. [YouCompleteMe](https://github.com/Valloric/YouCompleteMe) - visual assist for vim
![YouCompleteMe](/img/posts/vim-youcompleteme.gif)

    这是迄今为止，我认为VIM历史上最好的插件，没有之一。为什么这么说？因为作为一个程序员，这个功能必不可少，而它是迄今为止完成的最好的。从名字可以推断出，它的作用是代码补全。不管是在Source Insight，还是安装了Visual Assist的Visual Studio中，代码补全功能可以极大的提高生产力，增加编码的乐趣。大学第一次遇到Visual Assist时带给我的震撼至今记忆犹新，那感觉就似百兽之王有了翅膀，如虎添翼，从此只要安装有Visual Studio的地方我第一时间就会安装Visual Assist。

    而作为编辑器的VIM，上一直以来都没有一个能够达到Visual Assist哪怕一成功力的插件，不管是自带的补全，`omnicppcomplete`，`neocompletecache`，完全和Visual Assist不在一个数量级上。Visual Assist借助于Visual Studio，它的补全是语义层面的，它完全能够理解程序语言，而VIM的这些插件仅仅是基于文本匹配，虽然最近的`neocompletecache`已经好了很多，但准确率非常低。所以在写代码时，即使VIM用得再顺手，绝大部分情况下我还是倾向于`Visual Studio + Visual Assist`。

    但是YouCompleteMe的出现彻底的改变了这一现状，它对代码的补全完全终于也达到了编译器级别，绝不弱于Visual Assist，遇到它是我使用VIM之后最兴奋的一件事。为什么一个编辑器的插件可以做到如此的神奇，原因就在于它基于[LLVM/clang](http://clang.llvm.org/)，一个Apple公司为了代替GNU/GCC而支持的编译器，正因YouCompleteMe有了编译器的支持，而不再像以往的插件一样基于文本来进行匹配，所以准确率才如此之高。其次，由于它是C/S架构，会在本机创建一个服务器端，利用clang来解析代码，然后将结果返回给客户端，所以也就解决了VIM是单线程而造成的各种补全插件速度奇慢的诟病，在使用时，几乎感觉不到任何的延时，体验达到了Visual Assist的级别。

    YouCompleteMe也是所有的插件当中安装最为复杂的一个，这是因为需要用clang来编译相应的库。因为clang在Linux和Mac平台上支持的非常好，所以在这两个平台上安装相对简单。但是clang并没有官方支持Windows，所以YouCompleteMe插件也没有官方支持Windows。可这么好的东西，活跃在Windows上聪明的VIMer们怎么可能容忍这种事情呢，有人就提供了[Windows Installation Guide](https://github.com/Valloric/YouCompleteMe/wiki/Windows-Installation-Guide)，已经编译好了各种版本的YouCompleteMe插件，可以参考这个Guide来安装。我并没有采用它，而是参考了[这里](http://weichong78.blogspot.com/2013/11/building-llvmclang-youcompleteme-etc-in.html)，自己编译了YouCompleteMe，其实也不难，一步一步按照介绍的步骤，相信你也可以。

    YouCompleteMe除了补全以外，还有一个非常重要的作用：`代码跳转`，同样可以达到编译器级别的准确度，媲美Visual Assist与Source Insight。

    有了YouCompleteMe之后，是时候抛弃昂贵的Visual Assist与Source Insight了。赶快安装尝试吧:-)

    `--help:` 只要设置好项目的`.ycm_extra_conf.py`，自动补全功能就可以完美的使用了。通常一个全局的`.ycm_extra_conf.py`足矣。代码跳转可以绑定一个快捷键：`nnoremap <leader>jd :YcmCompleter GoToDefinitionElseDeclaration<CR>`，很好理解，先跳到定义，如果没找到，则跳到声明处。

2. [UltiSnips](https://github.com/SirVer/ultisnips) - ultimate snippets
![UltiSnips](/img/posts/vim-ultisnips.gif)

    这是什么？相信大家经常在写代码时需要在文件开头加一个版权声明之类的注释，又或者在头文件中要需要：`#ifndef... #def... #endif`这样的宏，亦或者写一个`for`、`switch`等很固定的代码片段，这是一个非常机械的重复过程，但又十分频繁。我十分厌倦这种重复，为什么不能有一种快速输入这种代码片段的方法呢？于是，各种snippets插件出现了，而它们之中，UltiSnips是最好的一个。比如上面的一长串`#ifndef... #def... #endif`，你只需要输入`ifn<TAB>`，怎么样，方便吧。更为重要的一点是它支持扩展，你可以随心所欲的编辑你自己的snippets。

    现在它可以和上面介绍的YouCompleteMe插件一块使用，比如在敲完`ifn`时，YouCompleteMe会将这个snippet也放在下拉框中让你选择，这样你就不用去记何时按<TAB>来展开snippets，YouCompleteMe已经帮你完成。

    去它的[网站](https://github.com/SirVer/ultisnips#screencasts)看看，有几个视频，绝对亮瞎你的双眼(需要翻墙)。

    '--help:' 它和YouCompleteMe一块使用时会有一定的冲突，因为两者都默认绑定了`<TAB>`键，可以参考各自的`help`文档，将其中一个绑定到其它的快捷键，或者借助[其它的插件](http://www.tuicool.com/articles/eU7BNf)让它们兼容。

3. [Zen Coding](http://www.vim.org/scripts/script.php?script_id=2981) - hi-speed coding for html/css
![Zen Coding](/ima/posts/vim-zen-coding.gif)

    比一般的`C/C++/Java`等更多重复劳动的语言估计要算HTML/CSS这类前端语言了吧，为此前端大牛发明了Zen Coding，去[这里](http://vimeo.com/7405114)(需翻墙)看看演示视频，相当令人震撼。如果是写前端的话，强烈推荐此插件。

    `--help:` 可以去这里参考前端工程师们写的中文教程[1](http://www.zfanw.com/blog/zencoding-vim-tutorial-chinese.html)，[2](http://www.qianduan.net/zen-coding-a-new-way-to-write-html-code.html)

#### 语法

1. [Tabularize](https://github.com/godlygeek/tabular) - align everything
![Tabularize](/ima/posts/vim-easy-align.gif)

    这个插件的作用是用于按等号、冒号、表格等来对齐文本，参考下面这个初始化变量的例子：
        int var1 = 10;
        float var2 = 10.0;
        char *var_ptr = "hello";

    运行`'<,'>Tabularize /=`可得：
        int var1      = 10;
        float var2    = 10.0;
        char *var_ptr = "hello";

    另一个常见的用法是格式化文件头：
        file: main.cpp
        author: feihu
        date: 2013-12-17
        description: this is the introduction to vim
        license: 
        TODO:

    运行`'<,'>Tabularize /:/r0`可得：
        file        : main.cpp
        author      : feihu
        date        : 2013-12-17
        description : this is the introduction to vim
        license     :
        TODO        :

    另一种对齐方式，运行`'<,'>Tabularize /:/r1c1l0`：
               file : main.cpp
             author : feihu
               date : 2013-12-17
        description : this is the introduction to vim
            license :
               TODO :

    对于写代码的人来说，还是非常有用的。因为没有找到对应的图，所以这里就用[另外一个插件](https://github.com/junegunn/vim-easy-align)的动画来代替了，Tabular的功能比它更为强大。

    `--help:` 通常会绑定这样一些快捷键：
        nmap <Leader>a& :Tabularize /&<CR>
        vmap <Leader>a& :Tabularize /&<CR>
        nmap <Leader>a= :Tabularize /=<CR>
        vmap <Leader>a= :Tabularize /=<CR>
        nmap <Leader>a: :Tabularize /:<CR>
        vmap <Leader>a: :Tabularize /:<CR>
        nmap <Leader>a:: :Tabularize /:\zs<CR>
        vmap <Leader>a:: :Tabularize /:\zs<CR>
        nmap <Leader>a, :Tabularize /,<CR>
        vmap <Leader>a, :Tabularize /,<CR>
        nmap <Leader>a,, :Tabularize /,\zs<CR>
        vmap <Leader>a,, :Tabularize /,\zs<CR>
        nmap <Leader>a<Bar> :Tabularize /<Bar><CR>
        vmap <Leader>a<Bar> :Tabularize /<Bar><CR>

2. [Syntastic](https://github.com/scrooloose/syntastic) - integrated syntax checking
![Syntastic](/img/posts/vim-syntastic.png)

    这是一个非常有用的插件，它能够实时的进行语法和编码风格的检查，利用它几乎可以做到编码完成后无编译错误。并且它还集成了静态检查工具：`lint`，可以让你的代码更加完美。更强大的它支持近百种编程语言，像是一个集大成的实时编译器。出现错误之后，可以非常方便的跳转到出错处。**强烈推荐**。

    `--help:` 这是一个后台运行的插件，不需要手动的任何命令来激活它。

3. [Python-mode](https://github.com/klen/python-mode) - Python in VIM

    如果你需要写Python，那么Python-mode是你一定不能错过的插件，仅靠它就可以把你的VIM打造成一个强大的Python IDE，因为它可以做到一个现代IDE能做的一切：
    - 查询Python文档
    - 语法及代码风格检查
    - 运行调试
    - 代码重构
    - ……

#### 其它

1. [Easymotion](https://github.com/Lokaltog/vim-easymotion) - jump anywhere
![Easymotion](/img/posts/vim-easymotion.gif)
2. [NERDCommenter](https://github.com/scrooloose/nerdcommenter) - comment++
![NERDCommenter](/img/posts/vim-nerdcomment.gif)
3. [Surround](https://github.com/tpope/vim-surround) - managing all the "'[{}]'" etc
![Surround](/img/posts/vim-surround.gif)
4. [Gundo](https://github.com/sjl/gundo.vim) - time machine
5. [Sessionman](http://www.vim.org/scripts/script.php?script_id=2010) - session manager
6. [Powerline](https://github.com/Lokaltog/vim-powerline) - ultimate statusline utility
![Powerline](/img/posts/vim-powerline.png)

上面的图可以参考这里：
http://blog.csdn.net/wklken/article/details/9076621

##########################################################}

### 终极配置: spf13


### 与其它软件集成
- Firefox
- Visual Studio
    ViEmu
- Source Insight

### 一些资源
- 为什么VIM使用HJKL作为方向键？请看[这里][50]
- 为什么VIM和EMACS被称为最好的编辑器？这看[这里][51]
- VIM作者的演讲：《[高效编辑的7个习惯][52]》，视频请点[这里][53]

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
[10]: http://vim-adventures.com/
[11]: https://github.com/gmarik/vundle
[12]: https://github.com/
[13]: http://blog.vgod.tw/2009/12/08/vim-cheat-sheet-for-programmers/
[14]: http://vimcolorschemetest.googlecode.com/svn/html/index-c.html
[15]: http://ethanschoonover.com/solarized
[16]: https://github.com/altercation/solarized
[17]: https://github.com/altercation/ethanschoonover.com/tree/master/projects/solarized#editors--ides
[18]: https://github.com/tomasr/molokai
[19]: https://github.com/scrooloose/nerdtree
[20]: https://github.com/kien/ctrlp.vim
[21]: https://github.com/vim-scripts/taglist.vim
[22]: https://github.com/majutsushi/tagbar

[50]: http://news.cnblogs.com/n/141251/
[51]: http://blog.csdn.net/canlets/article/details/17307657
[52]: http://xbeta.info/7habits-edit.htm
[53]: http://v.youku.com/v_show/id_XMTIwNDY5MjY4.html
[54]: http://blog.csdn.net/wklken/article/details/9076621
