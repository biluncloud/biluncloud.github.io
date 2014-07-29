---
layout: post
title:  以普通用户启动的Vim如何写需要root权限的文件
description: 如果未以sudo启动Vim，写需要root权限的文件时会报readonly错误，本文介绍了如何不退出Vim的情况下写此类文件
tags:   Linux，Vim, sudo, tee, root
image:  vim-sudo.png
---

在Linux上工作的朋友很可能遇到过这样一种情况，当你用vi/Vim编辑完一个文件时，运行`:wq`保存退出，突然蹦出一个错误：
{{ more }}

    E45: 'readonly' option is set (add ! to override)

这表明文件是只读的，按照提示，加上`!`强制保存：`:w!`，结果又一个错误出现：

    "readonly-file-name" E212: Can't open file for writing

文件明明存在，为何提示无法打开？这错误又代表什么呢？查看文档`:help E212`：

    For some reason the file you are writing to cannot be created or overwritten.
    The reason could be that you do not have permission to write in the directory
    or the file name is not valid.

原来是可能没有权限，此时你才想起，这个文件需要root权限才能编辑，而当前登陆的只是普通用户，在编辑之前你忘了使用`sudo`来启动vi，所以系统会阻止保存。为了防止修改丢失，你只好先把它保存为另外一个临时文件`temp-file-name`，然后退出vi，再运行`sudo mv temp-file-name readonly-file-name`覆盖原文件。

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

但这样操作太麻烦。而且如果还需要接着编辑这个文件，希望保留vi的工作状态，编辑历史，想要能执行撤消操作作怎么办？能不能在不退出vi的情况下获得root权限来保存这个文件？

## 解决方案

答案是可以。执行这样一条命令即可：

    :w !sudo tee %

接下来我们来分析这个命令为什么可以工作。首先查看文档`:help :w`，向下可以看到：

    							*:w_c* *:write_c*
    :[range]w[rite] [++opt] !{cmd}
    			Execute {cmd} with [range] lines as standard input
    			(note the space in front of the '!').  {cmd} is
    			executed like with ":!{cmd}", any '!' is replaced with
    			the previous command |:!|.
    
    The default [range] for the ":w" command is the whole buffer (1,$)

对应前面的命令，如下所示：

    :       w               !sudo tee %
    |       |               |  |
    :[range]w[rite] [++opt] !{cmd}

我们并未指定`range`，参见帮助文档最下面一行，当`range`未指定时，默认情况下是整个文件。此外，这里也没有`opt`。

### vi中执行外部命令

接下来是一个叹号`!`，它表示后面部分是外部命令，文档中说的很清楚，这和直接执行`:!{cmd}`是一样的效果。后者的作用是打开shell执行一个命令，比如，运行`:!ls`，会显示当前工作目录下的所有文件，这是个非常有用的命令，任何可以在shell中执行的命令都可以在不退出vi的情况下运行，并且可以将结果读入到vi中来。试想，如果你要在vi中插入当前工作路径或者当前工作路径下的所有文件名，你可以运行：

    :r !pwd或:r !ls

此时所有的内容便被插入至vi中。

### 命令的另一种表示形式

注意看前面的文档中:

    Execute {cmd} with [range] lines as standard input

所以实际上这个`:w`并未真的保存当前文件，就像执行`:w new-file-name`时，它将当前文件的内容保存到另外一个`new-file-name`的文件中，在这里它相当于一个**另存为**，而不是**保存**。它将当前文档的内容写到后面命令的标准输入中，再来执行`cmd`，所以整个命令可以转换为一个普通的shell命令：

    $ cat readonly-file-name | sudo tee %

其中`sudo`很好理解，意为切换至root执行后面的命令，`tee`和`%`是什么呢？

### %的意义

我们先来看`%`，执行`:help cmdline-special`可以看到：

    In Ex commands, at places where a file name can be used, the following
    characters have a special meaning.  These can also be used in the expression
    function expand() |expand()|.
    	%	Is replaced with the current file name.		  *:_%* *c_%*

`%`会扩展成当前文件名，所以上述的`cmd`也就成了`sudo tee readonly-file-name`。此时整个命令即：

    $ cat readonly-file-name | sudo tee readonly-file-name

__注意__：在另外一个地方我们也经常用到`%`，没错，替换。但是那里`%`的作用不一样，执行`:help :%`查看文档：

    Line numbers may be specified with:		*:range* *E14* *{address}*
    	{number}	an absolute line number
    	...
    	%		equal to 1,$ (the entire file)		  *:%*

在替换中，`%`的意义是代表整个文件，而不是文件名。所以对于命令`:%s/old/new/g`，它表示的是替换整篇文档中的old为new。

### tee的作用

现在只剩一个难点: tee。它究竟有何用？

[维基百科](http://en.wikipedia.org/wiki/Tee_%28command%29)上对其有一个详细的解释，你也可以查看man page。下面这幅图很形象的展示了`tee`是如何工作的：

![tee的作用](/img/posts/tee.png)

`ls -l`的输出经过管道传给了`tee`，后者做了两件事，首先拷贝一份数据到文件`file.txt`，同时再拷贝一份到其标准输出。数据再次经过管道传给`less`的标准输入，所以它在不影响原有管道的基础上对数据作了一份拷贝并保存到文件中。看上图中间部分，它的作用很像大写的字母**T**，给数据流动增加了一个分支，`tee`的名字也由此而来。

那么上面的命令就容易理解了，`tee`将其标准输入中的内容写到了`readonly-file-name`中，从而达到了更新只读文件的目的。当然这里其实还有另外一半数据：`tee`的标准输出，因为后面没有其它的命令了，所以这份输出相当于被抛弃。当然也可以在后面补上`> /dev/null`，以显式的丢弃标准输出，但是这对整个操作没有影响，而且会增加输入的字符数，因此只需上述命令即可。

### 命令执行之后

运行完上述命令后，会出现下面的提示：

    W12: Warning: File "readonly-file-name" has changed and the buffer was changed in Vim as well
    See ":help W12" for more info.
    [O]K, (L)oad File:

vi提示文件更新，询问是确认还是重新加载文件。建议直接输入`O`，因为这样可以保留vi的工作状态，编辑历史，撤消等操作仍然可以继续。而如果选择`L`，文件会以全新的文件打开，所有的工作状态便丢失了，此时无法执行撤消，buffer中的内容也被清空。

## 更简单的方案：映射

上述方式非常完美的解决了文章开始提出的问题，但毕竟命令还是有些长，为了避免每次输入一长串的命令，可以将它[映射](http://stackoverflow.com/questions/2600783/how-does-the-vim-write-with-sudo-trick-work/2600852#2600852)为一个简单的命令加到`.vimrc`中：

{% highlight vim linenos %}
    " Allow saving of files as sudo when I forgot to start vim using sudo.
    cmap w!! w !sudo tee > /dev/null %
{% endhighlight %}

这样，简单的运行`:w!!`即可。命令后半部分`> /dev/null`在前面已经解释过，作用为显式的丢掉标准输出的内容。

## 为什么不用重定向

至此，一个比较完美但很tricky的方案已经完成。你可能会问，为什么不用下面这样更常见的命令呢？这不是更容易理解，更简单一些么？

    :w !sudo cat > %

我们来分析一遍，像前面一样，它可以被转换为相同功能的shell命令：

    $ cat readonly-file-name | sudo cat > %

这条命令看起来一点问题没有，可一旦运行，又会出现另外一个错误：

    /bin/sh: readonly-file-name: Permission denied
    
    shell returned 1

这是怎么回事？不是明明加了`sudo`么，为什么还提示说没有权限？稍安勿躁，原因在于重定向，它是由shell执行的，在一切命令开始之前，shell便会执行重定向操作，所以重定向并未受`sudo`影响，而当前的shell本身也是以普通用户身份启动，也没有权限写此文件，因此便有了上面的错误。

[这里](http://stackoverflow.com/questions/82256/how-do-i-use-sudo-to-redirect-output-to-a-location-i-dont-have-permission-to-wr)介绍了几种解决重定向无权限错误的方法，当然除了`tee`方案以外，还有一种比较方便的方案：以`sudo`打开一个shell，然后在该具有root权限的shell中执行含重定向的命令，如：

    :w !sudo sh -c 'cat > %'

可是这样执行时，由于单引号的存在，所以在vi中`%`并不会展开，它被原封不动的传给了shell，而在shell中，`%`相当于`nil`，所以文件被重定向到了`nil`，所有内容丢失，并未达到目的。

既然是由于`%`没有展开导致的错误，那么试着将单引号`'`换成双引号`"`再试一次：

    :w !sudo sh -c "cat > %"

成功！这是因为在将命令传到shell去之前，`%`已经被扩展为当前的文件名。

## 写在结尾

(全文完)

feihu

2014.07.29 于 Shenzhen

