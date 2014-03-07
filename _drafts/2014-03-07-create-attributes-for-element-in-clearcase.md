---
layout: post
title:  记一次当前工作目录问题的排查经历
description: 一个由当前工作目录引起的问题
tags:   ClearCase，clearvtree，git，gitk，当前工作目录，脚本，batch，debug，快捷方式
image:  debug-stdout.png
---

最近在使用ClearCase的时候遇到一个问题，当从命令行里启动版本树，并想给一个节点打上review属性时，经常会出现一个命令窗口一闪而过，刷新版本树之后却没能找到想要打的review属性，只有再次尝试才会正确打上。大家忍受了这个问题很久，但一直都没时间去解决这个问题。在连续几次遇到这情况之后，我觉得忍无可忍，下决心找到了问题的根源并给出了解决方案，在这里记录一下这次经历。

{{ more }}

## Table of Contents

* Table of Contents Placeholder
{:toc}

-----

### 故事背景

我们使用的版本管理工具是[ClearCase](http://www-03.ibm.com/software/products/zh/clearcase/)，一个集中式的商业化配置管理工具，类似于SVN，CVS等工具，但功能强大的多，有很强的扩展性，可以根据自己的需要进行一些订制与扩展，比如增加一些提交代码时的trigger，checkout代码时hook。当然，价格也不菲。

[clearvtree](https://publib.boulder.ibm.com/infocenter/cchelp/v7r0m1/index.jsp?topic=/com.ibm.rational.clearcase.doc/topics/u_ccvtree.htm)是用来查看一个文件版本树的工具，类似于`git`中的`gitk -- aFile`，可以非常方便的查看单个文件的修改历史。它可以从下面两种方式调用：

- ClearCase资源管理器，像Windows资源管理器很相似
- 命令行，直接输入`clearvtree file_path`

因为流程方面的要求，在每交提交一份代码之后，必须经过相应的单元测试，由提交者打上`unittested`属性，然后交给他人review，如果没问题，他会打上`reviewed`属性，只有在这两份属性共同存在的情况下，这个新版本才能进入build中，这从很大程度上保证了代码的质量。

使用[cleartool mkattr](http://www.ipnom.com/ClearCase-Commands/mkattr.html)命令可以打上这些属性，但由于这两个属性必须带上一些有用的信息，比如时间，执行者，所以为了方便起见，我们这里有一个脚本`reviewed_by_me.bat`(这里只讨论review，unittest的处理完全一样)去得到执行者与当前时间的信息，这个脚本里面的内容大致如下：

{% highlight batch linenos %}
    set path="%1"
    rem get time for var time
    ...
    rem get user for var user
    ...

    call cleartool mkattr reviewed_by_%user% \"%time%\"
    ...
{% endhighlight %}

然后在Windows的`SendTo`目录下创建一个快捷方式`reviewed`，指向这个脚本。于是，给一个文件打上属性时，只须：

1. 启动版本树
2. 在版本树中对相应的节点点击右键，然后在`SendTo`菜单下选择创建的`reviewed`选项

注：当然也可以从命令行，自己输入时间和执行者的信息，然后调用`cleartool mkattr`命令。

### 问题

一切都显得很正确，但用了一段时间之后发现一个奇怪的现象，打开版本树后，经常点了`reviewed`选项，发现一个命令窗口一闪而过，刷新却看不到刚打的属性，然后只有再试一次才能打上。这里就有三个问题：

1. 为什么问题不是每次都出现？
2. 为什么第一次没有打上，出了什么错误？
3. 为什么刷新一次之后就可以打上了？

### 猜测一

这里首先我需要看看第一次到底出了什么错误。由于命令窗口一闪而过，无法查看错误信息，所以只有让脚本执行完之后停下，而不是关闭退出。于是找到脚本文件，在最后加上`pause`，再试一次创建属性，得到了出错后的错误信息(这里假设文件是：`D:\project\src\test.cpp`，版本是`main\7`，所以在ClearCase里面整个文件的路径为`D:\project\src\test.cpp@@\main\7`)：

    cleartool: Error: Unable to access "project\src\test.cpp@@\main\7": No such file or directory.

在命令行中运行：

    D:\> ls project\src\test.cpp
    project\src\test.cpp

明明是存在的，怎么会显示找不到这个文件呢？

想到之前出现过在ClearCase中无法找到文件的情况，大量访问一些文件时偶尔会出现无法找到文件的情况，那是由于网络的问题。因为ClearCase采用的是集中式的版本控制，我们采用的创建view的方式是`Dynamic`，而不是`Snapshot`，所以所有的数据实际上存在于ClearCase服务器上，客户端想要访问一个文件时，会通过网络协议去服务器取，取回本地之后才能够访问。如果出现大量的文件访问，网络又不是特别好的情况下，就可能会出现无法访问文件的情况。

于是用`ccadminconsole.msc`命令去查找ClearCase所有的Log，结果真在`ClearCase\My Host\Server Logs\view`下找到了一些可疑的Log：

    Reloading view cache; expect temporary delays accessing objects in VOB XXX

难道是这个原因？去网上搜索一阵也无法得到有用的信息。转眼又想，既然刚刚是由于这个文件还没有取回本地导致的，如果我再次找到版本树，再尝试打`review`属性，是否就应该没问题了？抱着这种想法又试了一次，还是和刚刚一样的情况。于是否定了这个猜测。

### 猜测二

放弃了上面的猜测之后，又进行另一种猜测，会不会是`SendTo`的机制有些没弄明白的地方？如果不用`SendTo`的这种方式，而直接用前面介绍的命令，会有一样的结果么？于是在命令行中调用：

    D:\> cleartool mkattr reviewed_by_xxuser \"20140306_0952\" project\src\test.cpp@@\main\7
    Created attribute "reviewed_by_xxuser" on "project\src\test.cpp@@\main\7".

竟然成功了，那么问题可能就出现在`SendTo`上。于是猜想，难道是由于`SendTo`的实现机制有问题？如果不用`SendTo`，而是直接在命令行里调用这个脚本可以么？于是把上面的命令保存成一个脚本，放在`C:\test\reviewed_by_me.bat`，再调用一次：

    D:\> C:\test\reviewed_by_me.bat
    Created attribute "reviewed_by_xxuser" on "project\src\test.cpp@@\main\7".

仍然成功。

等等，这和`SendTo`的方式还有一点区别，`SendTo`是的确是调用了这个脚本，但是它是通过一个快捷方式来调用的，而不是直接运行脚本。为了达到一样的实验条件，再次创建一个快捷方式：`reviewed`，指向上述脚本。双击之后，发现果然出错了，一样的无法找到文件！

现在的问题就变成了双击以快捷方式打开的脚本和直接从命令行里启动的脚本有什么区别？也许大家看到这里就能猜到原因了，但是当时我还没有立刻意识到，而是同时思考了另外一个问题，为什么把版本树刷新一次又可以了呢？刷新前面都调用的是同样的`SendTo`，这次刷新前后有些什么区别？

### 猜测三

为了得到更多的信息，将`reviewed_by_me.bat`中的命令执行之后都打印一遍，执行两次之后注意到了问题所在。这是第一次失败时的结果：

    call cleartool mkattr reviewed_by_xxuser \"20140306_1002\" project\src\test.cpp@@\main\7
    cleartool: Error: Unable to access "project\src\test.cpp@@\main\7": No such file or directory.

这是刷新之后成功的结果：

    call cleartool mkattr reviewed_by_xxuser \"20140306_1003\" **D:\**project\src\test.cpp@@\main\7
    Created attribute "reviewed_by_xxuser" on "**D:\**project\src\test.cpp@@\main\7".

细心的你可能已经发现了这个区别，成功的那一次多了一个**D:\**，是一个完整路径，难道问题就出在这里？为什么前面直接在命令行中用这个不完整路径也能正确执行呢？

这个路径是怎样来的呢？在前面调用`clearvtree`时用的是：

    D:\> clearvtree project\src\test.cpp

难道是这个原因？于是我试了一次输入完整路径给`clearvtree`：

    D:\> clearvtree D:\project\src\test.cpp

然后再打一次`review`属性，真的成功了！

现在的问题就定位在路径上，文章刚开始的三个问题变成：

1. 为什么不完整的路径会出错？
2. 为什么同样是不完整的路径，在命令中的调用不出错，而通过`SendTo`就出错了？
3. 为什么刷新之后不完整的路径变完整了？


前几天我遇到一个很有趣的[Stack Overflow 问题](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#8235612)，提问者希望[GDB](http://www.gnu.org/s/gdb/)能够在一个特定的字符串写到stdout时中断程序。

除非你至少掌握了一些下面的知识，否则并不容易得到这个问题的答案：

- 汇编语言
- 操作系统
- C语言标准库
- GDB命令

我想出了一种可行的但是不可移植的解决方案，它依赖于x86指令集和Linux的系统调用[write(2)](http://linux.die.net/man/2/write)，所以本文的讨论限制在特定操作系统内核上的特定架构。

### 例子

我们使用下面的代码(定义在hello.c中)来演示如何用GDB在`"Hello World!\n"`写入stdout时中断。(feihu注：代码作了一定的修改，增加了另外一个输出字符串的函数，以更好的演示捕获特定字符串)

{% highlight cpp linenos %}
    #include <stdio.h>

    void test()
    {
        printf("Test\n");
    }

    int main()
    {
        printf("Hello World!\n");
        test();
        return 0;
    }
{% endhighlight %}

用下面的命令编译链接：

    # gcc -g -o hello hello.c

用下面的命令调试：

    # gdb hello

### 在write中设置断点

第一步，我们需要找出如何在有数据被写到stdout时中断程序。我们假设你调试代码的作者没有疯，他们采用了所选语言的标准用法来向stdout写数据(比如C语言中的[printf(3)](http://linux.die.net/man/3/printf))，或者他们直接调用系统调用[write(2)](http://linux.die.net/man/2/write)。

实际上**最终`printf(3)`也调用的是`write(2)`**，所以不管采用上面哪种方式都可以。

因此你可以在[write(2)](http://linux.die.net/man/2/write)系统调用中设置一个断点：

    $gdb break write

GDB也许会抱怨它并不知道`write`函数，但是它可以在将来这个函数有效时再在其中设置这一断点：

    Function "write" not defined.
    Make breakpoint pending on future shared library load? (y or [n])

这完全没问题，直接输入`y`即可。

### 在write中写到STDOUT时设置断点

一旦你能够在`write`函数中设置断点后，你需要设置一个条件，只有在写到stdout时才中断，这里有一点复杂。看看`write(2)`的[帮助页面](http://linux.die.net/man/2/write)：第一个参数`fd`是要写的文件描述符，在Linux中，stdout的文件描述符是[1](http://linux.die.net/man/3/stdout)(也许你使用的平台有所不同)。

于是你的第一反应是这样：

    $gdb condition 1 fd == 1

**但是很遗憾，这不起作用。**(feihu注：会出现这样的错误`No symbol "fd" in current context.`)除非你非常幸运，否则不可能已经加载了`write(2)`系统调用的调试`symbols`，这意味着你不能以参数名来访问传给系统调用的参数。

### 获取系统调用参数

当然，还有其它的方法可以获取传给系统调用的参数，GDB提供了非常完善的手段让你来访问各种汇编寄存器，在这个问题中，我们感兴趣的是[Extended Stack Pointer](http://wiki.osdev.org/Stack#Stack_example_on_the_X86_architecture)，也就是`esp`寄存器。(feihu注：这里仅适用于x86 32位系统，x86 64位系统的解决方案请向下看。)

当一个函数调用发生时，栈中储存了：

- 函数的返回地址
- 指向函数参数的指针

这意味着当调用`write`函数时，栈的结构可能像下面一样：

![系统调用参数](/img/posts/stdout-table.jpg)

_这是假设地址占4个字节，根据你自己的机器作相应的调整_

所以现在你可以像这样设置条件断点：

    $gdb break write if *(int *)($esp + 4) == 1

_再一次声明，假设地址占4个字节_

注意，`$esp`能够访问`ESP`寄存器，它将所有的数据都看成是`void *`。因为GDB不允许直接将`void *`转换成`int`型(这么做是对的)，所以你需要先将`($esp + 4)`转换成`int *`，然后再对其指针取值以获得文件描述符参数的值。

### 限定到特定字符串

接下来更加复杂一点，它是上一步的扩展，而且，它并不适用于所有的情况。传给`printf(3)`的字符串并不一定会完整的传给`write(2)`，它可能会被分成更小的块然后一次性的写到文件中，调试stdout时请记住这一点，当然如果用短字符串的话应该没问题。(feihu注：调用`printf`时并不会每次都调用`write`，而是会先把数据放到缓冲区，等缓冲区积累到一定量时才会一次性的写到文件中。如果想到立即写到文件中的话，需要调用[fflush](http://www.cplusplus.com/reference/cstdio/fflush/)。)

现在你必须再将这个断点加上一定的限制，当且仅当一个特定的字符串传给`write(2)`时才中断程序。为了做到这一点，你可以对`write`的第二个参数`buf`调用[strcmp(3)](http://linux.die.net/man/3/strcmp)。从前面的表中可知，`$esp + 8`指向的就是`buf`，所以再给断点增加一个条件就变得很简单了：

    $gdb break write if *(int *)($esp + 4) == 1 && strcmp("Hello World!\n", *(char **)($esp + 8)) == 0

请记住，`$esp + n / sizeof(void *)`就代表了函数第n个参数的指针，这表明`$esp + 8`指向的是一个指向字符串的指针，为了让它能够正确的运行，你需要做一些转换和取值操作。

### 64位系统的解决方案

64位系统需要采用`RDI`和`RSI`寄存器。(feihu注：对于32位系统，所有的函数参数是写在栈里面的，所以可以用前面介绍的办法。但是64位系统中函数的参数并未存放在栈中，它提供了更多的寄存器用于存放参数，请戳[这里](http://en.wikipedia.org/wiki/X86_calling_conventions#System_V_AMD64_ABI)。)

    $gdb break write if 1 == $rdi && strcmp((char *)($rsi), "Hello World!\n") == 0

注意这里没有了指针的转换操作，因为寄存器里面存的不是指向栈中元素的指针，它们存的是值本身。

### 总结

经过上面的一系列步骤之后，你可以得到一个移植性不好的解决方案，在一些特定的平台和架构下，可以使用GDB在一个特定的字符串写到stdout时中断程序。

如果你有一个更好的解决方案，或者仅仅是另外一个替代方案，请在下面留言，并且/或者直接在Stack Overflow上[回答](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#8235612)这个问题。还有，如果你有一种方案可以工作在其它平台或者架构下，请一定也给我留言。

----

## 再进一步

原文的翻译就到上面，但是这里还可以再做一些改进。比如上面的`strcmp`函数可以用下面的函数来代替：

- [strncmp](http://en.cppreference.com/w/cpp/string/byte/strncmp)对于你只想匹配前`n`个字符的情况非常有用
- [strstr](http://en.cppreference.com/w/cpp/string/byte/strstr)可以用来查找子字符串，这个非常有用，因为你不能确定你要查找的字符串到底是完整的一次由`write`输出的，还是经过几次`printf`在缓存区合并之后才写到控制台的，因此我更加倾向这个方法

## Windows上的解决方案

随后我想，能不能在Windows平台上也使用类似的方法，最终也成功了(x86-64位操作系统下的Win32和64位程序)。

对于所有的写文件操作来说，Linux最终都会调用到它的POSIX API `write`函数，Windows和Linux不一样，它提供的API是[WriteFile](http://msdn.microsoft.com/en-us/library/windows/desktop/aa365747%28v=vs.85%29.aspx)，最终Windows上的调用都会用到它。但是，不像开源的Linux可以调试write，Windows无法调试WriteFile函数，所以也无法在WriteFile处设置断点。

但微软公开了部分VC的源码，所以我们可以在给出的源代码部分找到最终调用WriteFile的地方，在那一层设置断点即可。经过调试，我发现最后是`_write_nolock`调用了WriteFile，这个函数位于`your\VS\Folder\VC\crt\src\write.c`，函数原型如下：


{% highlight cpp %}
    /* now define version that doesn't lock/unlock, validate fh */
    int __cdecl _write_nolock (
            int fh,
            const void *buf,
            unsigned cnt
            )
{% endhighlight %}

对比Linux的write系统调用：

{% highlight cpp %}
    #include <unistd.h>
    
    ssize_t write(int fd, const void *buf, size_t count); 
{% endhighlight %}

每个参数都可以对应的起来，所以完全可以参照上面的方法来处理，在`_write_nolock`中设置一个条件断点即可，只有一些细节不一样。

### 可移植方案

很神奇的是Windows下面，在设置条件断点时可以直接使用变量名，而且在Win32和x64下面都可以。这样的话调试就变得简单了很多：

1. 在`_write_nolock`处增加一个断点

    **注意**：Win32和x64在这里有些许不同，Win32可以直接将函数名作为断点的位置，而x64如果直接设置在函数名处是无法中断的，我调试了一下发现原因在于x64的函数入口处会给这些参数赋值，所以在赋完值之前这些参数名还是无法使用的。我们这里可以有一个work around：不在函数的入口处设置断点，设置在函数的第一行，此时参数已经初始化，所以可以正常使用了。(即不用函数名作为断点的位置，而是用文件名+行号；或者直接打开这个文件，在相应的位置设置断点即可。)
2. 设置条件：

        fh == 1 && strstr((char *)buf, "Hello World") != 0

**注意**：但是这里有一个问题，我测试了`printf`和`std::cout`，对于前者，所有的字符串一次都写到了`_write_nolock`中，然而`std::cout`是一次传一个字符，这样也就无法使用后面比较字符串这个条件了。

### 只适用Win32的方案

当然，这里我们也可以采用前面介绍的方法，通过寄存器来设置断点的条件。同样由于平台的差异，这里分Win32和x64来讨论。

对于Win32程序，和前面介绍的Linux下使用GDB的方法基本一致。注意到函数前面的`__cdecl`，这种调用约定表明：

- 参数由右至左传递
- 调用方负责清理栈
- 非特殊情况下，会在函数名前加下划线来修饰
- 不执行任何大小写转换

可以参考[这里](http://msdn.microsoft.com/en-us/library/zkwh89ks.aspx)。微软的网站上还有一个[例子](http://msdn.microsoft.com/en-us/library/a5s9345t.aspx)来展示函数调用时参数在栈中的情况，结果请看[这里](http://msdn.microsoft.com/en-us/library/25687bhx.aspx)，它给出的每一种调用约定下寄存器和栈的使用情况。

知道这些之后，设置一个条件断点就变得非常容易了：

1. 在`_write_nolock`处设置一个断点
2. 增加条件：

        *(int *)($esp + 4) == 1 && strstr(*(char **)($esp + 8), "Hello") != 0

同前面介绍的Linux下的方法一样，条件的第一部分是对`fh`，只有当向`stdout`写数据时才中断。第二部分是针对`buf`，当其中含有特定的字符串时满足中断条件。

### 只适用x64的方案

从x86到x64有两个重要的[改变](http://msdn.microsoft.com/en-us/library/ms235286.aspx)，一是地址容量从32位变成了64位，二是增加了一些64位寄存器。因为这些寄存器的增加，x64就只使用[`__fastcall`](http://msdn.microsoft.com/en-us/library/6xa169sk.aspx)这种方式作为调用约定，这种方式会将前四个参数放到寄存器中，如果有更多参数的话，会存到栈中。

关于参数传递可以参考[这里](http://msdn.microsoft.com/en-us/library/zthk2dkh.aspx)，函数调用时前四个参数会依次放到：`RCX`、`RDX`、`R8`和`R9`当中，因此增加条件断点也变得很容易：

1. 在`_write_nolock`处设置一个断点：

    **注意**：这里直接在入口设置即可，不需要像前面可移植方案中介绍的那样设置到函数的第一行，因为寄存器在入口处已经有了正确的值。
2. 设置条件：

        $rcx == 1 && strstr((char *)$rdx, "Hello") != 0

由于`esp`是将所有的数据都看成是`void *`，所以需要做一定的转换才可以使用。而这里的寄存器存的是参数的值，所以不需要这个转换。所以`rcx`本身就是`fh`的值，而`rdx`中存的是一个指针，将它转成`char *`之后即可表示字符串。

### 写在结尾

同样，这个方法也有一定的局限性，比如对于`std::cout`，我还没有找到好的解决办法。

我也将这后面Windows上的方法发到[Stack Overflow](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#21179562)和[原文](http://anthony-arnold.com/2011/12/20/debugging-stdout/)的评论中，算是给这个问题的一个扩展吧。如果你有更好的解决方案，请给我们留言或者直接在[Stack Overflow](http://stackoverflow.com/questions/8235436/how-can-i-monitor-whats-being-put-into-the-standard-out-buffer-and-break-when-a/8235612#21179562)回答。

(全文完)

feihu

2014.01.16 于 Shenzhen
