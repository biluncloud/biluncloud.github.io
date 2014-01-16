---
layout: post
title:  谁打印了这个字符串
description: 如何在一个很大的程序中找到谁打印了这个字符串，调试stdout
tags:   GDB，调试，标准输出，stdout，断点，Linux
image:  hello-world.gif
---

前段时间在调试时遇到一个问题，运行程序出现错误，但并没有足够的信息来定位错误所在。可喜的是控制台上输出了一些可疑信息，只要找到了哪里打印了这些信息便有可能推断错误的原因。然而由于程序过于庞大，不可能一步一步跟踪调试去查找哪条语句执行后输出了这段字符串。尝试在所有的代码中搜索这段字符串也无功而返。后来突发奇想，能否在输出字符串时设置一个条件断点，只要输出的这段信息就中断，这样就可以在中断后找到何处打印了这些可疑信息，进而解决程序的问题了。

{{ more }}

经过大量的搜索之后，在stackoverflow上找到了[答案](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#8235612)，并且成功的解决了我的问题。被采用答案的作者`Anthony Arnold`由于十分喜欢这个问题，所以写了一篇关于它的[博文](http://anthony-arnold.com/2011/12/20/debugging-stdout/)。我也特别喜欢这个问题，之前数次遇到过此类问题，但都采用别的方式解决，而只有这个答案最完美。同时它综合运用了很多知识，能够给我们的调试带来不少启发。因为网上也没有再找到其它的解决方案，所以我决定翻译此文，离开学校之后第一次翻译，不好之处欢迎指正。

# Table of Contents

* Table of Contents Placeholder
{:toc}

-----

# 调试STDOUT

前几天我遇到一个很有趣的[Stack Overflow 问题](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#8235612)，提问者希望[GDB](http://www.gnu.org/s/gdb/)能够在一个特定的字符串写到stdout时中断程序。

除非你至少掌握了一些下面的知识，否则并不容易得到这个问题的答案：

- 汇编语言
- 操作系统
- C语言标准库
- GDB命令

我想出了一种可行的但是不可移植的解决方案，它依赖于x86指令集和Linux的系统调用[write(2)](http://linux.die.net/man/2/write)，所以本文的讨论限制在特定操作系统内核上的特定架构。

## 例子

我们使用使用下面的代码(定义在hello.c中)来演示如何用GDB在`"Hello World!\n"`写入stdout时中断。(feihu注：代码作了一定的修改以更好的演示)

    #include <stdio.h>

    void test()
    {
        printf("Test\n");
    }

    int main()
    {
        printf("Hello World!\n");
        return 0;
    }

用下面的命令编译链接：

    # gcc -g -o hello hello.c

用下面的命令调试：

    # gdb hello

## 在write中设置断点

第一步，我们需要找出如何在有数据被写到stdout时中断程序。我们假设你调试代码的作者没有疯，他们采用了所选语言的标准用法来向stdout写数据(比如C语言中的[printf(3)](http://linux.die.net/man/3/printf))，或者他们直接调用系统调用[write(2)](http://linux.die.net/man/2/write)。

事际上**最终`printf(3)`也调用的是`write(2)`**，所以不管采用上面哪种方式都可以。

因此你可以在[write(2)](http://linux.die.net/man/2/write)系统调用中设置一个断点：

    $gdb break write

GDB也许会抱怨它并不知道`write`函数，但是它可以在将来这个函数有效时再在其中设置这一断点：

    Function "write" not defined.
    Make breakpoint pending on future shared library load? (y or [n])

这完全没问题，直接输入`y`即可。

## 在write中写到STDOUT时设置断点

一旦你能够在`write`函数中设置断点后，你需要设置一个条件，只有在写到stdout时才中断，这里有一点复杂。看看`write(2)`的[帮助页面](http://linux.die.net/man/2/write)：第一个参数`fd`是要写的文件描述符，在Linux中，stdout的文件描述符是[1](http://linux.die.net/man/3/stdout)(也许你使用的平台有所不同)。

于是你的第一反应是这样：

    $gdb condition 1 fd == 1

**但是很遗憾，这不起作用。**(feihu注：会出现这样的错误`No symbol "fd" in current context.`)除非你非常幸运，否则不可能已经加载了`write(2)`系统调用的调试`symbols`，这意味着你不能以参数名来访问传给系统调用的参数。

## 获取系统调用参数

当然，还有其它的方法可以获取传给系统调用的参数，GDB提供了非常完善的手段让你来访问各种汇编寄存器，在这个问题中，我们感兴趣的是[Extended Stack Pointer](http://wiki.osdev.org/Stack#Stack_example_on_the_X86_architecture)，也就是`esp`寄存器。(feihu注：这里仅适用于x86 32位系统，x86 64位系统的解决方案请向下看。)

当一个函数调用发生时，栈中储存了：

- 函数的返回地址
- 指向函数参数的指针

这意味着当调用`write`函数时，栈的结构可能像下面一样：

TODO: 这里换成一个截图好了
<table border=1>
<tr>
<th>ESP Offset (bytes)</th>
<th>Points to Argument</th>
<th>Value</th>
</tr>
<tr>
<td>0</td>
<td>N/A</td>
<td>Return address</td>
</tr>
<tr>
<td>4</td>
<td><em>fd</em></td>
<td>File descriptor</td>
</tr>
<tr>
<td>8</td>
<td><em>buf</em></td>
<td>Pointer to the buffer to write</td>
</tr>
<tr>
<td>12</td>
<td><em>count</em></td>
<td>The number of bytes to write</td>
</tr>
</table>

_这是假设地址占4个字节，根据你自己的机器作相应的调整_

所以现在你可以像这样设置条件断点：

    $gdb break write if *(int *)($esp + 4) == 1

_再一次声明，假设地址占4个字节_

注意，`$esp`能够访问`ESP`寄存器，它将所有的数据都看成是`void *`。因为GDB不允许直接将`void *`转换成`int`型(这么做是对的)，所以你需要先将`($esp + 4)`转换成`int *`，然后再对其指针取值以获得文件描述符参数的值。

## 限定到特定字符串

接下来更加复杂一点，它是上一步的扩展，而且，它并不适用于所有的情况。传给`printf(3)`的字符串并不一定会完整的传给`write(2)`，它可能会被分成更小的块然后一次性的写到文件中，调试stdout时请记住这一点，当然如果用短字符串的话应该没问题。(feihu注：调用`printf`时并不会每次都调用`write`，而是会先把数据放到缓冲区，等缓冲区积累到一定量时才会一次性的写到文件中。如果想到立即写到文件中的话，需要调用[fflush](http://www.cplusplus.com/reference/cstdio/fflush/)。)

现在你必须再将这个断点加上一定的限制，当且仅当一个特定的字符串传给`write(2)`时才中断程序。为了做到这一点，你可以对`write`的第二个参数`buf`调用[strcmp(3)](http://linux.die.net/man/3/strcmp)。从前面的表中可知，`$esp + 8`指向的就是`buf`，所以再给断点增加一个条件就变得很简单了：

    $gdb break write if *(int *)($esp + 4) == 1 && strcmp("Hello World!\n", *(char **)($esp + 8)) == 0

请记住，`$esp + n / sizeof(void *)`就代表了函数第n个参数的指针，这表明`$esp + 8`指向的是一个指向字符串的指针，为了让它能够正确的运行，你需要做一些转换和取值操作。

## 64位系统的解决方案

64位系统需要采用`RDI`和`RSI`寄存器。(feihu注：对于32位系统，所有的函数参数是写在栈里面的，所以可以用前面介绍的办法。但是64位系统中函数的参数别未存放在栈中，它提供了更多的寄存器用于存放参数，请戳[这里](http://en.wikipedia.org/wiki/X86_calling_conventions#System_V_AMD64_ABI)。)

    $gdb break write if 1 == $rdi && strcmp((char *)($rsi), "Hello World!\n") == 0

注意这里没有了指针的转换操作，因为寄存器里面存的不是指向栈中元素的指针，它们存的是值本身。

## 总结

经过上面的一系列步骤之后，你可以得到一个移植性不好的解决方案，在一些特定的平台和架构下，可以使用GDB在一个特定的字符串写到stdout时中断程序。

如果你有一个更好的解决方案，或者仅仅是另外一个替代方案，请在下面留言，并且/或者直接在Stack Overflow上[回答](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#8235612)这个问题。还有，如果你有一种方案可以工作在其它平台或者架构下，请一定也给我留言。

----

## 再进一步

原文的翻译就到上面，但是这里还可以再做一些改进。比如上面的`strcmp`函数可以用下面的函数来代替：

- [strncmp](http://en.cppreference.com/w/cpp/string/byte/strncmp)对于你只想匹配前`n`个字符的情况非常有用
- [strstr](http://en.cppreference.com/w/cpp/string/byte/strstr)可以用来查找子字符串，这个非常有用，因为你不能确定你要查找的字符串到底是完整的一次由`write`输出的，还是经过几次`printf`在缓存区合并之后才写到控制台的，因为我更加倾向这个方法

# Windows上的解决方案

我尝试过在Windows平台上使用类似的方法，最终也成功的解决了(x86-64位操作系统下的Win32和64位程序)。

对于所有的写文件操作来说，Linux最终都会调用到它的POSIX API `write`函数，Windows和Linux不一样，它提供的API是[WriteFile](http://msdn.microsoft.com/en-us/library/windows/desktop/aa365747%28v=vs.85%29.aspx)，最终Windows上的调用都会用到它。但是，不像开源的Linux可以调试write，Windows无法调试WriteFile函数，所以也无法在WriteFile处设置断点。

但微软公开了部分VC的源码，所以我们可以在给出的源代码部分找到最终调用WriteFile的地方，在那一层设置断点即可。经过调试，我发现最后是`_write_nolock`调用了WriteFile，这个函数位于`your\VS\Folder\VC\crt\src\write.c`，函数原型如下：


    /* now define version that doesn't lock/unlock, validate fh */
    int __cdecl _write_nolock (
            int fh,
            const void *buf,
            unsigned cnt
            )

对比Linux的write系统调用：

    #include <unistd.h>
    
    ssize_t write(int fd, const void *buf, size_t count); 

每个参数都可以对应的起来，所以完全可以参照上面的方法来处理，在`_write_nolock`中设置一个条件断点即可，只有一些细节不一样。

## 可移植方案

很神奇的是Windows下面，在设置条件断点时可以直接使用变量名，而且在Win32和x64下面都可以。这样的话调试就变得简单了很多：

1. 在`_write_nolock`处增加一个断点

    **注意**：Win32和x64在这里有些许不同，Win32可以直接将函数名作为断点的位置，而x64如果直接设置在函数名处是无法中断的，我调试了一下发现原因在于x64的函数入口处会给这些参数赋值，所以在赋完值之前这些参数名还是无法使用的。我们这里可以有一个work around：不在函数的入口处设置断点，设置在函数的第一行，此时参数已经初始化，所以可以正常使用了。(即不用函数名作为断点的位置，而是用文件名+行号；或者直接打开这个文件，在相应的位置设置断点即可。)。
2. 设置条件：
        fh == 1 && strstr((char *)buf, "Hello World") != 0

## 只适用Win32的方案
## 只适用x64的方案

*(int *)($ebp+8)==1
strstr(*(char **)($ebp+12), "main")!=0

rcx
rdx
r8
http://msdn.microsoft.com/en-us/library/ms235286.aspx
http://msdn.microsoft.com/en-us/library/zthk2dkh.aspx
C:\Program Files (x86)\Microsoft Visual Studio 10.0\VC\crt\src\write.c
------------------------------------------------
前两天同事让我在小组内部分享一下VIM，于是我花了一点时间写了个简短的教程。虽然准备有限，但分享过程中大家大多带着一种惊叹的表情，原来编辑器可以这样强大，这算是对我多年来使用VIM的最大鼓舞吧。所以分享结束之后，将这篇简短教程整理一下作为我2014年的第一篇Blog。

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

### 为什么犹豫选择它们

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

首先，VIM包含了上面列的所有现代编辑器的优点，并且远远多于此。

并且，VIM拥有让你不再**犹豫**的其它特性：

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

这也并没有多神奇，它只是VIM提供的一种特殊的模式：`Insert mode`，在按过`i`之后，你可以在编辑器的左下角看到`INSERT`字样。但是因为VIM无法使用`CTRL-S`来保存，那么，在编辑完之后，如何保存退出呢？也很简单，先按`ESC`，再输入`:wq`，前面一步是告诉VIM退出`INSERT`模式，后面一个命令是保存退出。

我见过很多人这样用，虽然说这很容易，但是有种暴殄天物的感觉，和给了你一把AK47，你却把它当成棍子使一样。要发挥AK47的作用，还请向下看。

### VIM的基本用法

最好的入门教程非VIM自带的[vimtutor][6]莫属，它是VIM安装之后自带的简短教程，可以在安装目录下找到，只需半个小时左右的时间，就可以掌握VIM的绝大部分用法。这是迄今为止我见过的软件自带教程中最好的一个。

当然，网上的VIM教程也非常多，我之前看的是李果正的[大家来学VIM][7]，很适合入门。

另外推荐陈皓的[简明VIM练级攻略][8]，或者创意十足的游戏[VIM大冒险][10]。

[![VIM大冒险](/img/posts/vim-adventures.jpg)][10]

这游戏的创意实在是太赞了，打完游戏，你便掌握了VIM，这才是真正的**寓教于乐**，下面是摘自这个游戏的描述：

> VIM Adventures is an online game based on VIM's keyboard shortcuts (commands, motions and operators). It's the "Zelda meets text editing" game. It's a puzzle game for practicing and memorizing VIM commands (good old VI is also covered, of course). It's an easy way to learn VIM without a steep learning curve.

最后在这里给大家分享一个vgod设计的[VIM命令图解][13]。这也是我看过的最好的命令图示，看完了前面的基本教程后，可以将它作为一个cheat sheet随时查看，相信用不了多久你也可以完全丢掉它。关于此图的详细解释可以参考[这里][13]。

[![VIM命令图解](/img/posts/vim-cmd.png)][13]

### VIM进阶：插件

在学完了上面任何一个教程之后，通过一段时间的练习，你已经可以非常熟练的使用VIM。即使是“裸奔”，VIM已经足够强大，能够完成日常的绝大部分工作。但VIM更加强大的是它的扩展机制，就像Firefox和Chrome的各种插件，它们将令我们的工具更加完美。网上有很多教程里写的插件已经过时，接下来我将介绍一些比较新的，非常有用的插件，看完之后，相信你一定会觉得蠢蠢欲动。

#### 插件管理神器：Vundle

在这开始之前，先简单介绍VIM插件的管理方式。在我刚接触插件之时，安装一个插件需要：

1. 去官网下载
2. 解压
3. 拷贝到VIM的安装目录
4. 运行:help tags

这些步骤已经足够复杂，更加无法想象的是要**更新**或者**删除**一个插件时，因为它的文件分布在各个目录下，就比如Windows上的`安装路径`，`Application data`，`用户数据`，`注册表`等等，除非你对VIM的插件机制和要删的插件了如直掌，否则你能难将它删除干净。所以一段时间之后，VIM的安装目录下简直就是一团乱麻，管理插件几乎成为了一项不可能完成的任务。想象一下，如果Windows上面没有软件管理工具，你如何安装，卸载一个软件吧。

但是这没有难倒聪明的Vimer们，他们利用VIM本身的特性，开发出了神器——[Vundle][11]，配合上[GitHub][12]，VIM插件的管理变得前所未有的简单。来对比一下使用Vundle如何管理插件：

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

    这是一个非常有用的插件，它能够标记文件中的`FIXME`、`TODO`等信息，并将它们存放到一个任务列表当中，后面随时可以通过Tasklist跳转到这些标记的地方再来修改这些代码，是一个十分方便实用的Todo list工具。

    `--help:` 通常只需添加一个映射：`map <leader>td <Plug>TaskList`

#### 自动补全

1. [YouCompleteMe](https://github.com/Valloric/YouCompleteMe) - visual assist for vim
![YouCompleteMe](/img/posts/vim-youcompleteme.gif)

    这是迄今为止，我认为VIM历史上最好的插件，没有之一。为什么这么说？因为作为一个程序员，这个功能必不可少，而它是迄今为止完成的最好的。从名字可以推断出，它的作用是代码补全。不管是在Source Insight，还是安装了Visual Assist的Visual Studio中，代码补全功能可以极大的提高生产力，增加编码的乐趣。大学第一次遇到Visual Assist时带给我的震撼至今记忆犹新，那感觉就似百兽之王有了翅膀，如虎添翼，从此只要安装有Visual Studio的地方我第一时间就会安装Visual Assist。

    而作为编辑器的VIM，一直以来都没有一个能够达到Visual Assist哪怕一成功力的插件，不管是自带的补全，`omnicppcomplete`，`neocompletecache`，完全和Visual Assist不在一个数量级上。Visual Assist借助于Visual Studio，它的补全是语义层面的，它完全能够理解程序语言，而VIM的这些插件仅仅是基于文本匹配，虽然最近的`neocompletecache`已经好了很多，但准确率非常低。所以在写代码时，即使VIM用得再顺手，绝大部分情况下我还是倾向于`Visual Studio + Visual Assist`。

    但是YouCompleteMe的出现彻底的改变了这一现状，它对代码的补全完全终于也达到了编译器级别，绝不弱于Visual Assist，遇到它是我使用VIM之后最兴奋的一件事。为什么一个编辑器的插件可以做到如此的神奇，原因就在于它基于[LLVM/clang](http://clang.llvm.org/)，一个Apple公司为了代替GNU/GCC而支持的编译器，正因为YouCompleteMe有了编译器的支持，而不再像以往的插件一样基于文本来进行匹配，所以准确率才如此之高。其次，由于它是C/S架构，会在本机创建一个服务器端，利用clang来解析代码，然后将结果返回给客户端，所以也就解决了VIM是单线程而造成的各种补全插件速度奇慢的诟病，在使用时，几乎感觉不到任何的延时，体验达到了Visual Assist的级别。

    YouCompleteMe也是所有的插件当中安装最为复杂的一个，这是因为需要用clang来编译相应的库。因为clang在Linux和Mac平台上支持的非常好，所以在这两个平台上安装相对简单。但是clang并没有官方支持Windows，所以YouCompleteMe插件也没有官方支持Windows。可这么好的东西，活跃在Windows上聪明的Vimer们怎么可能容忍这种事情呢，有人就提供了[Windows Installation Guide](https://github.com/Valloric/YouCompleteMe/wiki/Windows-Installation-Guide)，已经编译好了各种版本的YouCompleteMe插件，可以参考这个Guide来安装。我并没有采用它，而是参考了[这里](http://weichong78.blogspot.com/2013/11/building-llvmclang-youcompleteme-etc-in.html)，自己编译了YouCompleteMe，其实也不难，一步一步按照介绍的步骤，相信你也可以。

    YouCompleteMe除了补全以外，还有一个非常重要的作用：`代码跳转`，同样可以达到编译器级别的准确度，媲美Visual Assist与Source Insight。

    有了YouCompleteMe之后，是时候抛弃昂贵的Visual Assist与Source Insight了。赶快安装尝试吧:-)

    `--help:` 只要设置好项目的`.ycm_extra_conf.py`，自动补全功能就可以完美的使用了。通常一个全局的`.ycm_extra_conf.py`足矣。代码跳转可以绑定一个快捷键：`nnoremap <leader>jd :YcmCompleter GoToDefinitionElseDeclaration<CR>`，很好理解，先跳到定义，如果没找到，则跳到声明处。

2. [UltiSnips](https://github.com/SirVer/ultisnips) - ultimate snippets
![UltiSnips](/img/posts/vim-ultisnips.gif)

    这是什么？相信大家经常在写代码时需要在文件开头加一个版权声明之类的注释，又或者在头文件中要需要：`#ifndef... #def... #endif`这样的宏，亦或者写一个`for`、`switch`等很固定的代码片段，这是一个非常机械的重复过程，但又十分频繁。我十分厌倦这种重复，为什么不能有一种快速输入这种代码片段的方法呢？于是，各种snippets插件出现了，而它们之中，UltiSnips是最好的一个。比如上面的一长串`#ifndef... #def... #endif`，你只需要输入`ifn<TAB>`，怎么样，方便吧。更为重要的一点是它支持扩展，你可以随心所欲的编辑你自己的snippets。

    现在它可以和上面介绍的YouCompleteMe插件一块使用，比如在敲完`ifn`时，YouCompleteMe会将这个snippet也放在下拉框中让你选择，这样你就不用去记何时按`<TAB>`来展开snippets，YouCompleteMe已经帮你完成。

    去它的[网站](https://github.com/SirVer/ultisnips#screencasts)看看，有几个视频，绝对亮瞎你的双眼(需要翻墙)。

    `--help:` 它和YouCompleteMe一块使用时会有一定的冲突，因为两者都默认绑定了`<TAB>`键，可以参考各自的`help`文档，将其中一个绑定到其它的快捷键，或者借助[其它的插件](http://www.tuicool.com/articles/eU7BNf)让它们兼容。

3. [Zen Coding](http://www.vim.org/scripts/script.php?script_id=2981) - hi-speed coding for html/css
![Zen Coding](/img/posts/vim-zen-coding.gif)

    比一般的`C/C++/Java`等更多重复劳动的语言估计要算HTML/CSS这类前端语言了吧，为此前端大牛发明了Zen Coding，去[这里](http://vimeo.com/7405114)(需翻墙)看看演示视频，相当令人震撼。如果是写前端的话，强烈推荐此插件。

    `--help:` 可以去这里参考前端工程师们写的中文教程[1](http://www.zfanw.com/blog/zencoding-vim-tutorial-chinese.html)，[2](http://www.qianduan.net/zen-coding-a-new-way-to-write-html-code.html)

#### 语法

1. [Syntastic](https://github.com/scrooloose/syntastic) - integrated syntax checking
![Syntastic](/img/posts/vim-syntastic.png)

    这是一个非常有用的插件，它能够实时的进行语法和编码风格的检查，利用它几乎可以做到编码完成后无编译错误。并且它还集成了静态检查工具：`lint`，可以让你的代码更加完美。更强大的它支持近百种编程语言，像是一个集大成的实时编译器。出现错误之后，可以非常方便的跳转到出错处。**强烈推荐**。

    `--help:` 这是一个后台运行的插件，不需要手动的任何命令来激活它。

2. [Python-mode](https://github.com/klen/python-mode) - Python in VIM
    <iframe width="480" height="405" src="http://www.56.com/iframe/NjQ2OTEyODA" frameborder="0" allowfullscreen=""> </iframe>

    如果你需要写Python，那么Python-mode是你一定不能错过的插件，靠它就可以把你的VIM打造成一个强大的Python IDE，因为它可以做到一个现代IDE能做的一切：

    - 查询Python文档
    - 语法及代码风格检查
    - 运行调试
    - 代码重构
    - ……

    所以，有了它，你就等于有了一个现代的Python IDE，各位Pythoner们，还等什么呢？

    `--help:` 默认情况下该插件已经绑定了几个快捷键：
    
        K         -> 跳到Python doc处
        <leader>r -> 运行当前代码
        <leader>b -> 增加/删除断点

#### 其它

1. [Tabularize](https://github.com/godlygeek/tabular) - align everything
![Tabularize](/img/posts/vim-easy-align.gif)

    这个插件的作用是用于按等号、冒号、表格等来对齐文本，参考下面这个初始化变量的例子：

        int var1 = 10;
        float var2 = 10.0;
        char *var_ptr = "hello";

    运行`Tabularize /=`可得：

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

    运行`Tabularize /:/r0`可得：

        file        : main.cpp
        author      : feihu
        date        : 2013-12-17
        description : this is the introduction to vim
        license     :
        TODO        :

    另一种对齐方式，运行`Tabularize /:/r1c1l0`：

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

2. [Easymotion](https://github.com/Lokaltog/vim-easymotion) - jump anywhere
![Easymotion](/img/posts/vim-easymotion.gif)

    VIM本身的移动方式已经是极其高效快速，它在编辑器的世界中独树一帜，算是一个极大的创新。而如果说它的移动方式是一个创新的话，那么Easy Motion的移动方式就是一个划时代的革命。利用VIM的`#w`、`#b`、`:#`等操作，移动到一个位置就像是大炮瞄准一个目标，它可以精确到一个大致的范围内。而Easy Motion可以比作是精确制导，它可以准备无误的定位到一个字母上。

    这种移动方式我曾在Firefox和Chrome的VIM插件中看到过，跳转到一个超链时就采用了同样的方式，但是由于浏览网页的特殊性与随意性，当时我没有适应。在编辑的时候就不一样了，编辑更加专注，更带有目的性，所以它能够极大的提高移动速度。享受这种光标指间跳跃，指随意动，移动如飞的感觉:-P

    `--help:` 插件默认的快捷键是：`<leader><leader>w`，效果如上图所示。

3. [NERDCommenter](https://github.com/scrooloose/nerdcommenter) - comment++
![NERDCommenter](/img/posts/vim-nerdcomment.gif)

    又是一个写代码必备的插件，用于快速，批量注释与反注释。它适用于任何你能想到的语言，会根据不同的语言选择不同的注释方式，方便快捷。

    `--help:` 十分简单的用法，默认配置情况下选择好要注释的行后，运行`<leader>cc`注释，`<leader>cu`反注释，也可以都调用`<leader>c<SPACE>`，它会根据是否有注释而选择来注释还是取消注释。

4. [Surround](https://github.com/tpope/vim-surround) - managing all the "'[{}]'" etc
![Surround](/img/posts/vim-surround.gif)

    在写代码时经常会遇到配对的符号，比如`{}[]()''""<>`等，尤其是标记类语言，比如html, xml，它们完全依赖这种语法。现代的各种编辑器一般都可以在输入一半符号的时候帮你自动补全另外一半。可有的时候你想修改、删除或者是增加一个块的配对符号时，它们就无能为力了。

    Surround就是一个专门用来处理这种配对符号的插件，它可以非常高效快速的修改、删除及增加一个配对符号。如果你经常和这些配对符号打交道，比如你是一个前端工程师，那么请一定不要错过这样一个神级插件。

    `--help:`：部分常用快捷键如下：

        Normal mode
        ds  - delete a surrounding
        cs  - change a surrounding
        ys  - add a surrounding
        yS  - add a surrounding and place the surrounded text on a new line + indent it
        yss - add a surrounding to the whole line
        ySs - add a surrounding to the whole line, place it on a new line + indent it
        ySS - same as ySs
        
        Visual mode
        s   - in visual mode, add a surrounding
        S   - in visual mode, add a surrounding but place text on new line + indent it
        
        Insert mode
        <CTRL-s> - in insert mode, add a surrounding
        <CTRL-s><CTRL-s> - in insert mode, add a new line + surrounding + indent
        <CTRL-g>s - same as <CTRL-s>
        <CTRL-g>S - same as <CTRL-s><CTRL-s>

5. [Gundo](https://github.com/sjl/gundo.vim) - time machine
![Gundo](/img/posts/vim-gundo.jpg)

    现代编辑器都提供了多次的撤消和重做功能，这样你就可以很放心的修改文档或者恢复文档。可是假如你操作了5次，然后撤消2次，再重新编辑后，你肯定是无法回到最开始的3次编辑了，因为在你复杂的操作后，编辑器维护的Undo Tree实际上出现了分支，而一般的`CTRL+Z`和`CTRL+R`无法实现这么复杂的操作。

    这时VIM的优势又体现了出来，它不仅提供无限撤消，VIM 7.3之后还有永久撤消功能，即使文件关闭后再次打开，之前的修改仍然可以撤消。而Gundo提供了一个树状图形的撤消列表，下方还有每次修改的差异对比，分支一目了然，相当于一个面向撤消与编辑操作的版本控制工具。有了它，你的文件编辑就像是有了一台时光机，可以随心所欲的回到任何时间，乘着你的时光机，放心大胆的去穿梭时空吧:-P

    `--help:` 通常会将这句加入`_vimrc`：`nnoremap <Leader>u :GundoToggle<CR>`

6. [Sessionman](http://www.vim.org/scripts/script.php?script_id=2010) - session manager

    这是VIM的Session Manager，作用很简单，管理VIM的会话，可以让你在重新打开VIM之后立刻进行之前的编辑状态，就像Windows的休眠一样，相信它一定是你工作的好伴侣。

    `--help:` 我的配置如下：

        set sessionoptions=blank,buffers,curdir,folds,tabpages,winsize
        nmap <leader>sl :SessionList<CR>
        nmap <leader>ss :SessionSave<CR>
        nmap <leader>sc :SessionClose<CR>

7. [Powerline](https://github.com/Lokaltog/vim-powerline) - ultimate statusline utility
![Powerline](/img/posts/vim-powerline.png)

    增强型的状态栏插件，可以以各种漂亮的颜色展示状态栏，显示文件编码，类型，光标位置，甚至可以显示版本控制信息。不仅功能强大，写着代码时看着下面赏心悦目的状态状，心情也因此大好。像我一样的外观控一定无法抗拒它:-)

    `--help:` 简单实用，无需多余的配置。

### 终极配置: spf13

至此，我经常用到的所有插件都介绍完了，如果你也都安装尝试一下的话，相信很容易就配置出来符合你个人习惯的强大的IDE。也许有人会想，这么多的主题、个性化设置、插件，配置太麻烦，有没有已经配置好的，可以直接拿来使用呢？其实我当时也有一样的想法，在折腾了很久之后，发现`_vimrc`已经非常庞大且混乱，亟需整理。再后来就发现了它，`spf13`：

![spf13](/img/posts/vim-spf13.png)

它是[Steve Francia's Vim Distribution](https://github.com/spf13/spf13-vim)，但是组织的非常整洁，容易扩展，并且跨平台，易于安装维护。在看到的所有`_vimrc`中，这是写的最漂亮的一个。只需要一个简单的脚本就可以[安装](http://vim.spf13.com/#install)，这里面利用了方便的`Vundle`集成了绝大部分前面介绍的插件，并且还有大量其它的插件，具体可以看它的`.vimrc.bundles`。

因为它完美的结构组织，你完全可以在不修改它任何文件的基础上，对应增加几个自己的`~/.vimrc.local`，`~/.vimrc.bundles.local`，`~/.vimrc.before.local`文件来增加自己的个性化配置，或者增加删除插件，可扩展性极强。在我的`_vimrc`乱成一团的情况，果断fork并安装了这个Distribution，增加了自己的一些配置，最终形成了现在的VIM。如果你也不愿折腾配置，那么完全可以直接安装它，省事方便的同时还可以学习一下它的组织结构，一举两得。

### 与其它软件集成

因为VIM的操作方式广泛为人们所逐渐接受，尤其是经常工作在Linux下的人们，所以它越来越多的被集成到其它一些常用的工具上，我用过的就包括：

- Visual Studio

    本身Windows下的gVim安装包在安装时会提供一个集成到Visual Studio中的插件`VsVim`，可以选择安装，但它是另开一个VIM的窗口来编辑当前的文件，我并不习惯这种方式，所以又找到了[`ViEmu`](http://www.viemu.com/)，它完美的将VIM的操作方式集成到了Visual Studio中，让你根本感觉不到这是在使用Visual Studio。更加强大的是，它可以完美的和Visual Assist集成：

    <blockquote>
    <p>
     Build 1854 contains a workaround for case=58034. Create a binary registry value named TrackCaretVisibility under HKCU\Software\Whole Tomato\Visual Assist X\VANet10 and set its value to 00 for compatibility with ViEmu. (The value defaults to 01 and is created for you upon exiting VS the first time you run 1854 or higher.)
         
    Note you need to close all IDEs before editing this registry key, to avoid Visual Assist X overwriting your change when it exits.
    </p>
    </blockquote>

    在遇到YouCompleteMe之前，这就是我所采用的编程环境。但这是一个商业版的插件，只有30天的试用期，如果你真的喜欢它的，完全可以买下它，绝对物超所值。更为强大的是它还支持`Xcode`、`Word`、`Outlook`、`SQL Server`，这一定是一个极端的Vimer的项目:-)，来看看它的动画：
    ![ViEmu](/img/posts/vim-viemu.gif)

- Source Insight

    VIM也可以集成到Source Insight中，不过我没有去找相应的插件，只找一种和前面介绍的`VsVim`一样的方法：

    - 在Source Insight菜单中，Options-Custom Commands
    - Run: "C:\Program Files\Vim\vim74\gvim.exe" --remote-silent +%l %f
    - Dir: %d
    - Add之后再Options-Key Assignments，将它绑定到一个快捷键中，比如`F11`

    这样编辑一个文件时，如果你想打开VIM时，直接按`F11`，它就会跳到当前行，编辑完之后关闭VIM，又回到Source Insight中。这种方法我用过一段时间，后来由于很少用Source Insight写代码，也逐渐淡忘了。

- Firefox/Chrome

    在狂热于VIM的年代，我曾想把一切操作都变成VIM的方式，包括上网。所以就找到了[Vimperator](https://addons.mozilla.org/en-US/firefox/addon/vimperator/)，但终究由于上网是一种更加随性、无目的的行为，拿着鼠标随便点点完全可以了，所以也就放弃它，回归到正常的操作方式下，有兴趣的可以把玩一下，很有意思，之前谈到的`Easy Motion`我就在这里见识过。Chrome下也有相应的[插件](https://chrome.google.com/webstore/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb)。

### 一些资源

最后附上一些有趣有用的资源：

- 一篇非常好的为什么使用VIM的文章，请看[这里](http://www.viemu.com/a-why-vi-vim.html)
- 为什么VIM使用HJKL作为方向键？请看[这里](http://news.cnblogs.com/n/141251/)
- 为什么VIM和EMACS被称为最好的编辑器？这看[这里](http://blog.csdn.net/canlets/article/details/17307657)
- VIM作者的演讲：《[高效编辑的7个习惯](http://xbeta.info/7habits-edit.htm)》，视频请点[这里](http://v.youku.com/v_show/id_XMTIwNDY5MjY4.html)

## 写在最后

网上可能有很多人像我之前一样，过于关于工具本身，而忽略了一个非常重要的问题：工具之所以称为工具，仅仅在于它是被人们拿来使用，只要顺手就好，用它来做的事情才是关键。对于我们开发人员来说，专业知识永远比工具更为重要。自打VIM出生以来，就有几个亘古不变的话题：
    VIM vs Emasc
    VIM vs 其它编辑器
    VIM vs IDE
争论从来没有平息过，从远古时期的大牛们，到刚刚踏入VIM阵营的我们，也从来没有一个结论。也许很多人争吵已经不再是单单的编辑器之争，而是出于维护心目中最好的工作方式，甚至哲学之争。但对于大部分人来说，只要你的工具足够称手，那么多写几行代码，多看些书，远比参与这些无休止的争吵强得多。但如果你更深一步，开发出更好的编辑器，或者插件，那又另当别论了。

这篇教程至此也将告一段落，说是教程，本文却并没有详细的介绍如何入门，反而回忆了一大段个人学习VIM的经历，然后介绍了常用的优秀插件。也许看完本文，你并不一定能够学会VIM，但是它提供了很多比本文更有价值去学习的资源，给了你一个整体的认识，让你看到VIM可以强大到什么程度，避免走很多弯路。看完本文之后，你能够知道如何入门，如何去选插件，我想，对于本文来说，这就够了。

feihu

2014.01.07 于 Shenzhen

---全文完---

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
