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

![系统调用参数](/img/posts/stdout-table.jpg)

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

但是这里有一个问题，我测试了`printf`和`std::cout`，对于前者，所有的字符串一次都写到了`_write_nolock`中，然而`std::cout`是一次传一个字符，这样也就无法使用后面比较字符串这个条件了。

## 只适用Win32的方案

当然，这里我们也可以采用前面介绍的方法，通过寄存器来增加条件。同样由于平台的差异，这里分Win32和x64来讨论。


## 只适用x64的方案

    *(int *)($ebp+8)==1
    strstr(*(char **)($ebp+12), "main")!=0

    rcx
    rdx
    r8
    http://msdn.microsoft.com/en-us/library/ms235286.aspx
    http://msdn.microsoft.com/en-us/library/zthk2dkh.aspx

