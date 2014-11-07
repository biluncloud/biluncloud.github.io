---
layout: post
title:  ssh连接远程主机执行脚本的环境变量问题
description: ssh连接远程主机直接执行脚本时，会出现脚本中的命令找不到的问题，本文深入分析了问题的根源，并详细讲解了bash的四种工作模式，以及在这几种模式下bash以什么顺序加载配置文件
tags:   Linux，ssh, bash, sh, login, interactive, /etc/profile, ~/.bash_profile, ~/.bash_login, ~/.profile, /etc/bash.bashrc, ~/.bashrc
image:  vim-sudo.png
---

近日在使用ssh命令`ssh user@remote ~/myscript.sh`登陆到远程机器remote上执行命令时，遇到一个奇怪的问题：

    ~/myscript.sh: line n: xxx: command not found

xxx是一个新安装的程序，安装路径明明已通过/etc/profile文件被加到环境变量中，为何会找不到？如果直接登陆远程机器并执行`~/myscript.sh`时，完全没有任何问题。但为什么使用了ssh远程执行同样的脚本就出错了呢？两种方式执行脚本到底有何不同？

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

__说明__，本文所使用的机器是：SUSE Linux Enterprise。

## 问题定位

这看起来像是环境变量引起的问题。于是我在这条命令之前加了一句：`which xxx`。在本机上执行脚本时，它会得到正确的路径。但再次用ssh来执行时，却遇到下面的问题：

    which: no xxx in (/usr/bin:/bin:/usr/sbin:/sbin)

这很奇怪，怎么括号中的环境变量没有了`xxx`程序的安装路径呢？环境变量不对。再次在脚本中加入`echo $PATH`并以ssh执行，这才发现，环境变量是系统初始化时的结果：

    /usr/bin:/bin:/usr/sbin:/sbin

这证明/etc/profile根本没有被调用。到底为什么呢？

我又尝试了将上面的ssh分解成下面两步：

    user@local > ssh user@remote
    user@remote> ~/myscript.sh

结果竟然成功了。那么这两种方式执行的命令有何不同呢？带着这个问题去查询了`man bash`，得到了答案。

## bash的四种模式

在开始揭晓谜底之前，我们需要先介绍bash的四种模式。bash会依据这四种模式而加载不同的配置文件，而且加载的顺序也有所不同，这些配置文件有：

- /etc/profile
- ~/.bash_profile
- ~/.bash_login
- ~/.profile
- /etc/bash.bashrc
- ~/.bashrc
- $BASH_ENV

会不会有点晕，为什么会有这么多的配置文件？
http://tristram.squarespace.com/home/2012/7/20/why-profile-bash_profile-and-bash_login.html解释了为什么有这么多种
.bash_profile is for making sure that both the things in .profile and .bashrc are loaded for login shells. For example, .bash_profile could be something simple like




    ~/.bash_profile should be super-simple and just load .profile and .bashrc (in that order)

    ~/.profile has the stuff NOT specifically related to bash, such as environment variables (PATH and friends)

    ~/.bashrc has anything you'd want at an interactive command line. Command prompt, EDITOR variable, bash aliases for my use

A few other notes:

    Anything that should be available to graphical applications OR to sh (or bash invoked as sh) MUST be in ~/.profile

    ~/.bashrc must not output anything: 只在non-interactive下输出

    Anything that should be available only to login shells should go in ~/.profile

    Ensure that ~/.bash_login does not exist.

我们来一一分析这几咱模式。


http://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/
    For Bash, they work as follows. Read down the appropriate column. Executes A, then B, then C, etc. The B1, B2, B3 means it executes only the first of those files found.

+----------------+-----------+-----------+------+
|                |Interactive|Interactive|Script|
|                |login      |non-login  |      |
+----------------+-----------+-----------+------+
|/etc/profile    |   A       |           |      |
+----------------+-----------+-----------+------+
|/etc/bash.bashrc|           |    A      |      |
+----------------+-----------+-----------+------+
|~/.bashrc       |           |    B      |      |
+----------------+-----------+-----------+------+
|~/.bash_profile |   B1      |           |      |
+----------------+-----------+-----------+------+
|~/.bash_login   |   B2      |           |      |
+----------------+-----------+-----------+------+
|~/.profile      |   B3      |           |      |
+----------------+-----------+-----------+------+
|BASH_ENV        |           |           |  A   |
+----------------+-----------+-----------+------+
|                |           |           |      |
+----------------+-----------+-----------+------+
|                |           |           |      |
+----------------+-----------+-----------+------+
|~/.bash_logout  |    C      |           |      |
+----------------+-----------+-----------+------+

插个图
Typically, most users will encounter a login shell only if either:
* they logged in from a tty, not through a GUI
* they logged in remotely, such as through ssh.

profile

其实看名字就能了解大概了, profile 是某个用户唯一的用来设置环境变量的地方, 因为用户可以有多个 shell 比如 bash, sh, zsh 之类的, 但像环境变量这种其实只需要在统一的一个地方初始化就可以了, 而这就是 profile.
bashrc

bashrc 也是看名字就知道, 是专门用来给 bash 做初始化的比如用来初始化 bash 的设置, bash 的代码补全, bash 的别名, bash 的颜色. 以此类推也就还会有 shrc, zshrc 这样的文件存在了, 只是 bash 太常用了而已.

### login, interactive
execute /etc/profile
IF ~/.bash_profile exists THEN
    execute ~/.bash_profile
ELSE
    IF ~/.bash_login exist THEN
        execute ~/.bash_login
    ELSE
        IF ~/.profile exist THEN
            execute ~/.profile
        END IF
    END IF
END IF
#### 控制台login
#### 远程login
### login, non-interactive
上面两种一样
### non-login, interactive
### non-login, non-interactive
### 典型模式总结
### 实践建议

## 再次尝试
仍然失败
### bash的sh模式
### 问题解决
#!/bin/bash --login

## 文件内容的建议
http://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/
http://superuser.com/questions/183870/difference-between-bashrc-and-bash-profile/183980#183980

-----
上面再遇到一个问题，启用hadoop时里面显示无法找到cleartool，但是我直接去一台机器上面去执行时，却能够找得到，调试了半天，最终定位到环境变量上。找到两篇文章：
http://blog.javachen.com/2014/01/18/bash-problem-when-ssh-access/#
http://blog.csdn.net/aeh129/article/details/8109940
https://github.com/sstephenson/rbenv/wiki/Unix-shell-initialization
把环境写到.bashrc里面去即可解决->待测试
试了一下不行，原因是sh其实是软连接到bash上，而当bash以sh为名启动时，它的读取策略就不行了，所以这里必须要改变ssh的登陆sh，让它使用bash，而不是sh
在脚本的最上面加上#!/bin/bash --login即可
或者这样也可以，前提上test.sh上面是用的bash，而不是sh，ssh cnszn02x14 'export BASH_ENV="~/.bashrc" ; ~/test.sh'
可以以此作为一篇博文来写，注意当sh是默认shell时

1. 介绍问题来源
2. 分析问题找到根源
3. 介绍bash的几种工作方式，明确每种方式的代表方法：分为普通用户和root用户么？
3.1 实验验证

4. 当sh是默认shell时的工作方式
5. 本机名为local，远程机用remote，用户都叫user，所以是ssh user@remote command

login shell:
-sh
-bash

https://github.com/sstephenson/rbenv/wiki/Unix-shell-initialization
介绍一下login的流程
login shell:
/etc/profile
~/.bash_profile->~./.bash_login->~/.profile只取第一个出现的
注意：这里没有调用~/.bashrc，所以你应该一直在~/.bash_profile的最后source ~/.bashrc

ssh一样

 ssh cnszn02x14 'BASH_ENV="~/.bashrc"  ~/test.sh'
 ssh cnszn02x14 'export BASH_ENV="~/.bashrc" ;  ~/test.sh'

每种文件适合放什么内容：
~/.profile
~/.bashrc
-----
在Linux上工作的朋友很可能遇到过这样一种情况，当你用Vim编辑完一个文件时，运行`:wq`保存退出，突然蹦出一个错误：

    E45: 'readonly' option is set (add ! to override)

{{ more }}
这表明文件是只读的，按照提示，加上`!`强制保存：`:w!`，结果又一个错误出现：

    "readonly-file-name" E212: Can't open file for writing

文件明明存在，为何提示无法打开？这错误又代表什么呢？查看文档`:help E212`：

    For some reason the file you are writing to cannot be created or overwritten.
    The reason could be that you do not have permission to write in the directory
    or the file name is not valid.

原来是可能没有权限造成的。此时你才想起，这个文件需要root权限才能编辑，而当前登陆的只是普通用户，在编辑之前你忘了使用`sudo`来启动Vim，所以才保存失败。于是为了防止修改丢失，你只好先把它保存为另外一个临时文件`temp-file-name`，然后退出Vim，再运行`sudo mv temp-file-name readonly-file-name`覆盖原文件。

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

但这样操作过于繁琐。而且如果只是想暂存此文件，还需要接着修改，则希望保留Vim的工作状态，比如编辑历史，buffer状态等等，该怎么办？能不能在不退出Vim的情况下获得root权限来保存这个文件？

## 解决方案

答案是可以，执行这样一条命令即可：

    :w !sudo tee %

接下来我们来分析这个命令为什么可以工作。首先查看文档`:help :w`，向下滚动一点可以看到：

    							*:w_c* *:write_c*
    :[range]w[rite] [++opt] !{cmd}
    			Execute {cmd} with [range] lines as standard input
    			(note the space in front of the '!').  {cmd} is
    			executed like with ":!{cmd}", any '!' is replaced with
    			the previous command |:!|.
    
    The default [range] for the ":w" command is the whole buffer (1,$)

把这个使用方法对应前面的命令，如下所示：

    :       w               !sudo tee %
    |       |               |  |
    :[range]w[rite] [++opt] !{cmd}

我们并未指定`range`，参见帮助文档最下面一行，当`range`未指定时，默认情况下是整个文件。此外，这里也没有指定`opt`。

### Vim中执行外部命令

接下来是一个叹号`!`，它表示其后面部分是外部命令，即`sudo tee %`。文档中说的很清楚，这和直接执行`:!{cmd}`是一样的效果。后者的作用是打开shell执行一个命令，比如，运行`:!ls`，会显示当前工作目录下的所有文件，这非常有用，任何可以在shell中执行的命令都可以在不退出Vim的情况下运行，并且可以将结果读入到Vim中来。试想，如果你要在Vim中插入当前工作路径或者当前工作路径下的所有文件名，你可以运行：

    :r !pwd或:r !ls

此时所有的内容便被读入至Vim，而不需要退出Vim，执行命令，然后拷贝粘贴至Vim中。有了它，Vim可以自由的操作shell而无需退出。

### 命令的另一种表示形式

再看前面的文档:

    Execute {cmd} with [range] lines as standard input

所以实际上这个`:w`并未真的保存当前文件，就像执行`:w new-file-name`时，它将当前文件的内容保存到另外一个`new-file-name`的文件中，在这里它相当于一个**另存为**，而不是**保存**。它将当前文档的内容写到后面`cmd`的标准输入中，再来执行`cmd`，所以整个命令可以转换为一个具有相同功能的普通shell命令：

    $ cat readonly-file-name | sudo tee %

这样看起来”正常”些了。其中`sudo`很好理解，意为切换至root执行后面的命令，`tee`和`%`是什么呢？

### %的意义

我们先来看`%`，执行`:help cmdline-special`可以看到：

    In Ex commands, at places where a file name can be used, the following
    characters have a special meaning.  These can also be used in the expression
    function expand() |expand()|.
    	%	Is replaced with the current file name.		  *:_%* *c_%*

在执行外部命令时，`%`会扩展成当前文件名，所以上述的`cmd`也就成了`sudo tee readonly-file-name`。此时整个命令即：

    $ cat readonly-file-name | sudo tee readonly-file-name

**注意**：在另外一个地方我们也经常用到`%`，没错，替换。但是那里`%`的作用不一样，执行`:help :%`查看文档：

    Line numbers may be specified with:		*:range* *E14* *{address}*
    	{number}	an absolute line number
    	...
    	%		equal to 1,$ (the entire file)		  *:%*

在替换中，`%`的意义是代表整个文件，而不是文件名。所以对于命令`:%s/old/new/g`，它表示的是替换整篇文档中的old为new，而不是把文件名中的old换成new。

### tee的作用

现在只剩一个难点: tee。它究竟有何用？[维基百科](http://en.wikipedia.org/wiki/Tee_%28command%29)上对其有一个详细的解释，你也可以查看man page。下面这幅图很形象的展示了`tee`是如何工作的：

![tee的作用](/img/posts/tee.png)

`ls -l`的输出经过管道传给了`tee`，后者做了两件事，首先拷贝一份数据到文件`file.txt`，同时再拷贝一份到其标准输出。数据再次经过管道传给`less`的标准输入，所以它在不影响原有管道的基础上对数据作了一份拷贝并保存到文件中。看上图中间部分，它很像大写的字母**T**，给数据流动增加了一个分支，`tee`的名字也由此而来。

现在上面的命令就容易理解了，`tee`将其标准输入中的内容写到了`readonly-file-name`中，从而达到了更新只读文件的目的。当然这里其实还有另外一半数据：`tee`的标准输出，但因为后面没有跟其它的命令，所以这份输出相当于被抛弃。当然也可以在后面补上`> /dev/null`，以显式的丢弃标准输出，但是这对整个操作没有影响，而且会增加输入的字符数，因此只需上述命令即可。

### 命令执行之后

运行完上述命令后，会出现下面的提示：

    W12: Warning: File "readonly-file-name" has changed and the buffer was changed in Vim as well
    See ":help W12" for more info.
    [O]K, (L)oad File:

Vim提示文件更新，询问是确认还是重新加载文件。建议直接输入`O`，因为这样可以保留Vim的工作状态，比如编辑历史，buffer等，撤消等操作仍然可以继续。而如果选择`L`，文件会以全新的文件打开，所有的工作状态便丢失了，此时无法执行撤消，buffer中的内容也被清空。

## 更简单的方案：映射

上述方式非常完美的解决了文章开始提出的问题，但毕竟命令还是有些长，为了避免每次输入一长串的命令，可以将它[映射](http://stackoverflow.com/questions/2600783/how-does-the-vim-write-with-sudo-trick-work/2600852#2600852)为一个简单的命令加到`.vimrc`中：

{% highlight vim linenos %}
" Allow saving of files as sudo when I forgot to start vim using sudo.
cmap w!! w !sudo tee > /dev/null %
{% endhighlight %}

这样，简单的运行`:w!!`即可。命令后半部分`> /dev/null`在前面已经解释过，作用为显式的丢掉标准输出的内容。

## 另一种思路

至此，一个比较完美但很tricky的方案已经完成。你可能会问，为什么不用下面这样更常见的命令呢？这不是更容易理解，更简单一些么？

    :w !sudo cat > %

### 重定向的问题

我们来分析一遍，像前面一样，它可以被转换为相同功能的shell命令：

    $ cat readonly-file-name | sudo cat > %

这条命令看起来一点问题没有，可一旦运行，又会出现另外一个错误：

    /bin/sh: readonly-file-name: Permission denied
    
    shell returned 1

这是怎么回事？不是明明加了`sudo`么，为什么还提示说没有权限？稍安勿躁，原因在于重定向，它是由shell执行的，在一切命令开始之前，shell便会执行重定向操作，所以重定向并未受`sudo`影响，而当前的shell本身也是以普通用户身份启动，也没有权限写此文件，因此便有了上面的错误。

### 重定向方案

[这里](http://stackoverflow.com/questions/82256/how-do-i-use-sudo-to-redirect-output-to-a-location-i-dont-have-permission-to-wr)介绍了几种解决重定向无权限错误的方法，当然除了`tee`方案以外，还有一种比较方便的方案：以`sudo`打开一个shell，然后在该具有root权限的shell中执行含重定向的命令，如：

    :w !sudo sh -c 'cat > %'

可是这样执行时，由于单引号的存在，所以在Vim中`%`并不会展开，它被原封不动的传给了shell，而在shell中，一个单独的`%`相当于`nil`，所以文件被重定向到了`nil`，所有内容丢失，保存文件失败。

既然是由于`%`没有展开导致的错误，那么试着将单引号`'`换成双引号`"`再试一次：

    :w !sudo sh -c "cat > %"

成功！这是因为在将命令传到shell去之前，`%`已经被扩展为当前的文件名。有关单引号和双引号的区别可以参考[这里](http://stackoverflow.com/questions/6697753/difference-between-single-and-double-quotes-in-bash)，简单的说就是单引号会将其内部的内容原封不动的传给命令，但是双引号会展开一些内容，比如变量，转义字符等。

当然，也可以像前面一样将它映射为一个简单的命令并添加到.vimrc中：

{% highlight vim linenos %}
" Allow saving of files as sudo when I forgot to start vim using sudo.
cmap w!! w !sudo sh -c "cat > %"
{% endhighlight %}

注意：这里不再需要把输出重定向到`/dev/null`中。

## 写在结尾

至此，借助Vim强大的灵活性，实现了两种方案，可以在以普通用户启动的Vim中保存需root权限的文件。两者的原理类似，都是利用了Vim可以执行外部命令这一特性，区别在于使用不同的shell命令。如果你还有其它的方案，欢迎给我留言。

(全文完)

feihu

2014.07.30 于 Shenzhen

