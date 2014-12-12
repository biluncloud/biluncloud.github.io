---
layout: post
title:  回车换行的故事
description: 本文通过一个工作中遇到的问题，深入分析，最终引出回车换行，详细分析了在各平台上回车换行的不同，以及一段回车换行的故事。
tags:   CR, LF, EOL, carriage return, line feed, 回车，换行，fopen, \r\n
image:  ssh.png
图片用一个老的打字机
---

不知各位有没有过这样的经历：

- Linux上创建的文件在Windows上打开时，结果所有内容会挤成一行。而Windows上创建的文件在Linux上打开时，每一行的结尾又多了一个奇怪字符`^M`。
- 又或者在安装Windows版的git时，安装程序在某一步会提示你选择"Configuring the line ending conversions"，里面提到了Windows-style和unix-style的line endings，为什么会有这些呢？
- 再或者你调用C语言的API `fopen`时，会有text mode和binary mode，这两者有什么区别？

其实这一切都和我们常说的回车换行有关，但你有没有很奇怪，什么是回车？直接用换行不就好了，为什么要用这两个词呢？我们使用的键盘上的键为什么叫回车，它却明明起得是换行的作用？千万别被绕晕了，本文将和大家讨论有关回车换行的一段有趣的历史。

## 历史

我们通常所说的回车换行其实只相当于一个概念，即一行结束，开始下一行（`EOL`，End-Of-Line）。你也可以将这理解为一个换行，但为了与回车换行中的换行区分开来，我们后面称呼它为`EOL`。

回车换行严格说起来是两个独立的概念，回车和换行，它们的出现要追溯到计算机出现之前，那时有一种电传打字机：Teletype Model 33 ASR，如下图：

![Teletype Model 33 ASR](http://bytecollector.com/images/asr-33_vcf_02.jpg)

在打字机上，有一个部件叫`Carriage`，它相当于打字机的光标。每输入一个字符，`Carriage`就前进一格。当输满一行后，想要切换到下一行时需要`Carriage`在两个方向上的运动：水平和竖直。水平方向上需要将`Carriage`移到一行的起始位置，竖直方向上需要纸张向上移动一行，此时也就是相当于`Carriage`下移了一行。（这在很多影视作品里面可以看到，打字者们打完一行之后，通常会用手拨动一个滑块，然后听到“咔”的一声，接着输入下一行。只是在这款打字机中不再需要人为的去拨动。）而这两个动作分别对应着：

- Carriage Return，CR，也即回车，它在ASCII表中的值为0x0D，`\r`
- Line Feed，LF，也即换行，它在ASCII表中的值为0x0A，`\n`

因为打字机是机械的结构，所以从设计上它需要将`EOL`这一操作换成两个独立的操作，这便是我们习惯连起来使用回车换行的原因。可以参照下图看看其键盘的布局：

![键盘布局](http://upload.wikimedia.org/wikipedia/commons/e/ea/Mappa_Teletype_ASR-33.jpg)

键盘的右方有一个`Line Feed`和`Return`，这分别对应着前面提到的两个操作。所以`EOL = CR + LF`。但是，通常一个回车不能够在一个字符打印的时间内完成，所以如果在在其移动的过程中按下了其它的键，打印的内容将变得十分混乱。所以有时会有1~3个NUL字符，以等待`EOL`操作的完成。

等到早期的计算机发明时，这两个概念被拿了过来。但是由于那时的存储设备非常昂贵，一些人认为在每行的结尾加两个字符其在是极大的浪费，于是各个厂商在这一点上便出现了分歧。

由于一些早期的微型计算机还没有用于隐藏底层硬件细节的设备驱动，所以它们直接沿用了打字机的惯例，使用不带NUL的CRLF作为一个`EOL`。而CP/M为了和这些微机使用同一个终端，也采用了这种设计。所以它的克隆MS-DOS也同样使用CRLF，由于Windows又是基于MS-DOS，所以就导致了如今的Windows是采用CRLF作为`EOL`。

而MULTICS在被设计之时就非常认真的考虑了这一问题，设计者们觉得只需一个字符便完全足够来表示`EOL`，这样更加合理。本来由于那时的键盘上都有一个Return键，所以可能更好的选择是`CR`。但当时考虑到`CR`可以用来完成重写一行，以完成如**粗体**和删除线等效果，所以他们选择了稍稍难以理解的Line Feed。然后自己设计了一个设备驱动程序来将`LF`转换为各种打字机所需要的`EOL`，非常完美。随后一脉相承的UNIX和Linux们都继承了这个选择，于是你在这些操作系统上可以发现每一行的结尾是一个`LF`，即`\n`，`0x0A`。

Mac系统的选择就显得稍微复杂一些。Apple在设计Mac OS时，他们采用了一个最容易理解的选择：`CR`，但这只维持到Mac OS 9，随后的Mac OSX采用了Mach-BSD的内核，所以此后版本的Mac OSX在每行的结尾存储了与Linux一样的`LF`。

## 历史

通过上面这段历史的简单介绍，相信你能够给出文章开始提出的几个问题了。因为Linux和Mac OSX上使用的是`LF`，而Windows上使用的是`CRLF`，那么Linux和Mac OSX上创建的文件在Windows上打开时，由于每一行的结尾只有一个`LF`，但Windows只认识`CRLF`，所以便不会有逻辑上的换行处理，故所有的文字被挤到了一行。同样，如果Windows上的文件在Linux和Mac OSX上打开时，仅需`LF`便可换行，那么每一行的结尾便多了一个`CR`，它相当于键盘上的Enter键，即`^M`。

## 编程语言的处理

为了避免在这些不同的实现中争气，在一些高级的语言中，使用了统一的方式来处理`EOL`。在C语言中，你一定注意到了在字符串中如果增加一个换行符的话，直接用`\n`即可，比如：

{% highlight bash linenos %}
    char *str = "This is the first line! \nThis is a new line!";
{% endhighlight %}

上面的输出将是：

    This is the first line!
    This is a new line!

`\n`即前面说的`LF`，C语言采用它是由于C语言是为开发Unix而设计的，所以它沿用了Unix的惯例便很容易理解了。

## fopen的两种模式

这里介绍了这台机器的历史，也是阮一峰那篇文章的出处
http://www.oualline.com/practical.programmer/eol.html

这里还说了其实不止CRLF，后面还会接些其它的内容
http://www.quora.com/What-is-the-ASCII-code-for-newline-character

这里说明了Text Mode像是一个过滤器，它可以把CR过滤掉
http://www.mrx.net/c/openmodes.html

这个wiki也给出了很好的翻译
http://en.wikipedia.org/wiki/Newline

下面也介绍了换行的故事
http://www.rfc-editor.org/EOLstory.txt

120页讲述了一小段历史，很有用
ftp://ftp.vim.org/pub/vim/doc/book/vimbook-OPL.pdf

阮一峰的文章结出了非常好的说明：

今天，我总算搞清楚"回车"（carriage return）和"换行"（line feed）这两个概念的来历和区别了。

在计算机还没有出现之前，有一种叫做电传打字机（Teletype Model 33）的玩意，每秒钟可以打10个字符。但是它有一个问题，就是打完一行换行的时候，要用去0.2秒，正好可以打两个字符。要是在这0.2秒里面，又有新的字符传过来，那么这个字符将丢失。

于是，研制人员想了个办法解决这个问题，就是在每行后面加两个表示结束的字符。一个叫做"回车"，告诉打字机把打印头定位在左边界；另一个叫做"换行"，告诉打字机把纸向下移一行。

这就是"换行"和"回车"的来历，从它们的英语名字上也可以看出一二。

后来，计算机发明了，这两个概念也就被般到了计算机上。那时，存储器很贵，一些科学家认为在每行结尾加两个字符太浪费了，加一个就可以。于是，就出现了分歧。

Unix系统里，每行结尾只有"<换行>"，即"\n"；Windows系统里面，每行结尾是"<回车><换行>"，即"\r\n"；Mac系统里，每行结尾是"<回车>"。一个直接后果是，Unix/Mac系统下的文件在Windows里打开的话，所有文字会变成一行；而Windows里的文件在Unix/Mac下打开的话，在每行的结尾可能会多出一个^M符号。
###

可以先提每个平台上的各种CRLF如何处理，然后再提每个平台上的各种read, write函数怎么处理CRLF，最后再放这个例子
fopen man
http://man7.org/linux/man-pages/man3/fopen.3.html
the 'b' is ignored on all
       POSIX conforming systems, including Linux.  (Other systems may treat
       text files and binary files differently, and adding the 'b' may be a
       good idea if you do I/O to a binary file and expect that your program
       may be ported to non-UNIX environments.)

这里有一篇阮一峰的文章，讲了它们的由来：
http://www.ruanyifeng.com/blog/2006/04/post_213.html

介绍C语言标准库里面的几个函数

2014.12.09：开始收集资料
阮一峰关于回车换行来历的解释：http://www.ruanyifeng.com/blog/2006/04/post_213.html
VIM关于回车换行的处理
C语言标准库中关于回车换行的处理
http://blog.sciencenet.cn/blog-948919-697160.html
上面的原贴在这里：http://www.crifan.com/detailed_carriage_return_0x0d_0x0a_cr_lf__r__n_the_context/
用代码来表现一下fopen两种模式的区别
还有fgets, gets, fputs, puts

------------------------------

近日在使用ssh命令`ssh user@remote ~/myscript.sh`登陆到远程机器remote上执行脚本时，遇到一个奇怪的问题：

    ~/myscript.sh: line n: app: command not found

app是一个新安装的程序，安装路径明明已通过`/etc/profile`配置文件加到环境变量中，但这里为何会找不到？如果直接登陆机器remote并执行`~/myscript.sh`时，app程序可以找到并顺利执行。但为什么使用了ssh远程执行同样的脚本就出错了呢？两种方式执行脚本到底有何不同？如果你也心存疑问，请跟随我一起来展开分析。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

**说明**，本文所使用的机器是：SUSE Linux Enterprise。

## 问题定位

这看起来像是环境变量引起的问题，为了证实这一猜想，我在这条命令之前加了一句：`which app`，来查看app的安装路径。在remote本机上执行脚本时，它会打印出app正确的安装路径。但再次用ssh来执行时，却遇到下面的错误：

    which: no app in (/usr/bin:/bin:/usr/sbin:/sbin)

这很奇怪，怎么括号中的环境变量没有了`app`程序的安装路径？不是已通过`/etc/profile`设置到`PATH`中了？再次在脚本中加入`echo $PATH`并以ssh执行，这才发现，环境变量仍是系统初始化时的结果：

    /usr/bin:/bin:/usr/sbin:/sbin

这证明`/etc/profile`根本没有被调用。为什么？是ssh命令的问题么？

随后我又尝试了将上面的ssh分解成下面两步：

    user@local > ssh user@remote    # 先远程登陆到remote上
    user@remote> ~/myscript.sh      # 然后在返回的shell中执行脚本

结果竟然成功了。那么ssh以这两种方式执行的命令有何不同？带着这个问题去查询了`man ssh`：

> If command is specified, it is executed on the remote host instead of a login shell.

这说明在指定命令的情况下，命令会在远程主机上执行，返回结果后退出。而未指定时，ssh会直接返回一个登陆的shell。但到这里还是无法理解，直接在远程主机上执行和在返回的登陆shell中执行有什么区别？即使在远程主机上执行不也是通过shell来执行的么？难道是这两种方式使用的shell有什么不同？

暂时还没有头绪，但隐隐感到应该与shell有关。因为我通常使用的是`bash`，所以又去查询了`man bash`，才得到了答案。

## bash的四种模式

在man page的**INVOCATION**一节讲述了`bash`的四种模式，`bash`会依据这四种模式而选择加载不同的配置文件，而且加载的顺序也有所不同。本文ssh问题的答案就存在于这几种模式当中，所以在我们揭开谜底之前先来分析这些模式。

### interactive + login shell

第一种模式是交互式的登陆shell，这里面有两个概念需要解释：interactive和login：

login故名思义，即登陆，login shell是指用户以非图形化界面或者以ssh登陆到机器上时获得的**第一个**shell，简单些说就是需要输入用户名和密码的shell。因此通常不管以何种方式登陆机器后用户获得的第一个shell就是login shell。

interactive意为交互式，这也很好理解，interactive shell会有一个输入提示符，并且它的标准输入、输出和错误输出都会显示在控制台上。所以一般来说只要是需要用户交互的，即一个命令一个命令的输入的shell都是interactive shell。而如果无需用户交互，它便是non-interactive shell。通常来说如`bash script.sh`此类执行脚本的命令就会启动一个non-interactive shell，它不需要与用户进行交互，执行完后它便会退出创建的shell。

那么此模式最简单的两个例子为：

- 用户直接登陆到机器获得的第一个shell
- 用户使用`ssh user@remote`获得的shell

#### 加载配置文件

这种模式下，shell首先加载`/etc/profile`，然后再尝试依次去加载下列三个配置文件之一，**一旦找到其中一个便不再接着寻找**：

- ~/.bash_profile
- ~/.bash_login
- ~/.profile

下面给出这个加载过程的伪代码：

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

为了验证这个过程，我们来做一些测试。首先设计每个配置文件的内容如下：

{% highlight bash linenos %}
user@remote > cat /etc/profile
echo @ /etc/profile
user@remote > cat ~/.bash_profile
echo @ ~/.bash_profile
user@remote > cat ~/.bash_login
echo @ ~/.bash_login
user@remote > cat ~/.profile
echo @ ~/.profile
{% endhighlight %}

然后打开一个login shell，注意，为方便起见，这里使用`bash -l`命令，它会打开一个login shell，在`man bash`中可以看到此参数的解释：

> -l        Make bash act as if it had been invoked as a login shell 

进入这个新的login shell，便会得到以下输出：

    @ /etc/profile
    @ /home/user/.bash_profile

果然与文档一致，bash首先会加载全局的配置文件`/etc/profile`，然后去查找`~/.bash_profile`，因为其已经存在，所以剩下的两个文件不再会被查找。

接下来移除`~/.bash_profile`，启动login shell得到结果如下：

    @ /etc/profile
    @ /home/user/.bash_login

因为没有了`~/.bash_profile`的屏蔽，所以`~/.bash_login`被加载，但最后一个`~/.profile`仍被忽略。

再次移除`~/.bash_login`，启动login shell的输出结果为：

    @ /etc/profile
    @ /home/user/.profile

`~/.profile`终于熬出头，得见天日。通过以上三个实验，配置文件的加载过程得到了验证，除去`/etc/profile`首先被加载外，其余三个文件的加载顺序为：`~/.bash_profile` > `~/.bash_login` > `~/.profile`，只要找到一个便终止查找。

前面说过，使用ssh也会得到一个login shell，所以如果在另外一台机器上运行`ssh user@remote`时，也会得到上面一样的结论。

#### 配置文件的意义

那么，为什么bash要弄得这么复杂？每个配置文件存在的意义是什么？

`/etc/profile`很好理解，它是一个全局的配置文件。后面三个位于用户主目录中的配置文件都针对用户个人，也许你会问为什么要有这么多，只用一个`~/.profile`不好么？究竟每个文件有什么意义呢？这是个好问题。

Cameron Newham和Bill Rosenblatt在他们的著作《[Learning the bash Shell, 2nd Edition](http://book.douban.com/subject/3296982/)》的59页解释了原因：

> bash allows two synonyms for .bash_profile: .bash_login, derived from the C shell's file named .login, and .profile, derived from the Bourne shell and Korn shell files named .profile. Only one of these three is read when you log in. If .bash_profile doesn't exist in your home directory, then bash will look for .bash_login. If that doesn't exist it will look for .profile.
> 
> One advantage of bash's ability to look for either synonym is that you can retain your .profile if you have been using the Bourne shell. If you need to add bash-specific commands, you can put them in .bash_profile followed by the command source .profile. When you log in, all the bash-specific commands will be executed and bash will source .profile, executing the remaining commands. If you decide to switch to using the Bourne shell you don't have to modify your existing files. A similar approach was intended for .bash_login and the C shell .login, but due to differences in the basic syntax of the shells, this is not a good idea.

原来一切都是为了兼容，这么设计是为了更好的应付在不同shell之间切换的场景。因为bash完全兼容Bourne shell，所以`.bash_profile`和`.profile`可以很好的处理bash和Bourne shell之间的切换。但是由于C shell和bash之间的基本语法存在着差异，作者认为引入`.bash_login`并不是个好主意。所以由此我们可以得出这样的最佳实践：

- 应该尽量杜绝使用`.bash_login`，如果已经创建，那么需要创建`.bash_profile`来屏蔽它被调用
- `.bash_profile`适合放置bash的专属命令，可以在其最后读取`.profile`，如此一来，便可以很好的在Bourne shell和bash之间切换了

### non-interactive + login shell

第二种模式的shell为non-interactive login shell，即非交互式的登陆shell，这种是不太常见的情况。一种创建此shell的方法为：`bash -l script.sh`，前面提到过-l参数是将shell作为一个login shell启动，而执行脚本又使它为non-interactive shell。

对于这种类型的shell，配置文件的加载与第一种完全一样，在此不再赘述。

### interactive + non-login shell

第三种模式为交互式的非登陆shell，这种模式最常见的情况为在一个已有shell中运行`bash`，此时会打开一个交互式的shell，而因为不再需要登陆，因此不是login shell。

#### 加载配置文件

对于此种情况，启动shell时会去查找并加载`/etc/bash.bashrc`和`~/.bashrc`文件。

为了进行验证，与第一种模式一样，设计各配置文件内容如下：

{% highlight bash linenos %}
user@remote > cat /etc/bash.bashrc
echo @ /etc/bash.bashrc
user@remote > cat ~/.bashrc
echo @ ~/.bashrc
{% endhighlight %}

然后我们启动一个交互式的非登陆shell，直接运行`bash`即可，可以得到以下结果：

    @ /etc/bash.bashrc
    @ /home/user/.bashrc

由此非常容易的验证了结论。

#### bashrc VS profile

从刚引入的两个配置文件的存放路径可以很容易的判断，第一个文件是全局性的，第二个文件属于当前用户。在前面的模式当中，已经出现了几种配置文件，多数是以profile命名的，那么为什么这里又增加两个文件呢？这样不会增加复杂度么？我们来看看此处的文件和前面模式中的文件的区别。

首先看第一种模式中的profile类型文件，它是某个用户唯一的用来设置全局环境变量的地方, 因为用户可以有多个shell比如bash, sh, zsh等, 但像环境变量这种其实只需要在统一的一个地方初始化就可以, 而这个地方就是profile，所以启动一个login shell会加载此文件，后面由此shell中启动的新shell进程如bash，sh，zsh等都可以由login shell中继承环境变量等配置。

接下来看bashrc，其后缀`rc`的意思为[Run Commands](http://en.wikipedia.org/wiki/Run_commands)，由名字可以推断出，此处存放bash需要运行的命令，但注意，这些命令一般只用于交互式的shell，通常在这里会设置交互所需要的所有信息，比如bash的补全、alias、颜色、提示符等等。

所以可以看出，引入多种配置文件完全是为了更好的管理配置，每个文件各司其职，只做好自己的事情。

### non-interactive + non-login shell

最后一种模式为非交互非登陆的shell，创建这种shell典型有两种方式：

- bash script.sh
- ssh user@remote command

这两种都是创建一个shell，执行完脚本之后便退出，不再需要与用户交互。

#### 加载配置文件

对于这种模式而言，它会去寻找环境变量`BASH_ENV`，将变量的值作为文件名进行查找，如果找到便加载它。

同样，我们对其进行验证。首先，测试该环境变量未定义时配置文件的加载情况，这里需要一个测试脚本：

{% highlight bash linenos %}
user@remote > cat ~/script.sh
echo Hello World
{% endhighlight %}

然后运行`bash script.sh`，将得到以下结果：

    Hello World

从输出结果可以得知，这个新启动的bash进程并没有加载前面提到的任何配置文件。接下来设置环境变量`BASH_ENV`：

{% highlight bash linenos %}
user@remote > export BASH_ENV=~/.bashrc
{% endhighlight %}

再次执行`bash script.sh`，结果为：

    @ /home/user/.bashrc
    Hello World

果然，`~/.bashrc`被加载，而它是由环境变量`BASH_ENV`设定的。

### 更为直观的示图

至此，四种模式下配置文件如何加载已经讲完，因为涉及的配置文件有些多，我们再以两个图来更为直观的进行描述：

第一张图来自这篇[文章](http://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/)，bash的每种模式会读取其所在列的内容，首先执行A，然后是B，C。而B1，B2和B3表示只会执行第一个存在的文件：

    +----------------+--------+-----------+---------------+
    |                | login  |interactive|non-interactive|
    |                |        |non-login  |non-login      |
    +----------------+--------+-----------+---------------+
    |/etc/profile    |   A    |           |               |
    +----------------+--------+-----------+---------------+
    |/etc/bash.bashrc|        |    A      |               |
    +----------------+--------+-----------+---------------+
    |~/.bashrc       |        |    B      |               |
    +----------------+--------+-----------+---------------+
    |~/.bash_profile |   B1   |           |               |
    +----------------+--------+-----------+---------------+
    |~/.bash_login   |   B2   |           |               |
    +----------------+--------+-----------+---------------+
    |~/.profile      |   B3   |           |               |
    +----------------+--------+-----------+---------------+
    |BASH_ENV        |        |           |       A       |
    +----------------+--------+-----------+---------------+

上图只给出了三种模式，原因是第一种login实际上已经包含了两种，因为这两种模式下对配置文件的加载是一致的。

另外一篇[文章](http://www.solipsys.co.uk/new/BashInitialisationFiles.html)给出了一个更直观的图：

![Bash加载文件顺序](http://www.solipsys.co.uk/images/BashStartupFiles1.png)

上图的情况稍稍复杂一些，因为它使用了几个关于配置文件的参数：`--login`，`--rcfile`，`--noprofile`，`--norc`，这些参数的引入会使配置文件的加载稍稍发生改变，不过总体来说，不影响我们前面的讨论，相信这张图不会给你带来更多的疑惑。

### 典型模式总结

为了更好的理清这几种模式，下面我们对一些典型的启动方式各属于什么模式进行一个总结：

- 登陆机器后的第一个shell：login + interactive
- 新启动一个shell进程，如运行`bash`：non-login + interactive
- 执行脚本，如`bash script.sh`：non-login + non-interactive
- 运行头部有如`#!/usr/bin/env bash`的可执行文件，如`./executable`：non-login + non-interactive
- 通过ssh登陆到远程主机：login + interactive
- 远程执行脚本，如`ssh user@remote script.sh`：non-login + non-interactive
- 远程执行脚本，同时请求控制台，如`ssh user@remote -t 'echo $PWD'`：non-login + interactive
- 在图形化界面中打开terminal：
 - Linux上: non-login + interactive
 - Mac OS X上: login + interactive

相信你在理解了login和interactive的含义之后，应该会很容易对上面的启动方式进行归类。

## 再次尝试

在介绍完bash的这些模式之后，我们再回头来看文章开头的问题。`ssh user@remote ~/myscript.sh`属于哪一种模式？相信此时你可以非常轻松的回答出来：non-login + non-interactive。对于这种模式，bash会选择加载`$BASH_ENV`的值所对应的文件，所以为了让它加载`/etc/profile`，可以设定：

{% highlight bash linenos %}
user@local > export BASH_ENV=/etc/profile
{% endhighlight %}

然后执行上面的命令，但是很遗憾，发现错误依旧存在。这是怎么回事？别着急，这并不是我们前面的介绍出错了。仔细查看之后才发现脚本`myscript.sh`的第一行为`#!/usr/bin/env sh`，注意看，它和前面提到的`#!/usr/bin/env bash`不一样，可能就是这里出了问题。我们先尝试把它改成`#!/usr/bin/env bash`，再次执行，错误果然消失了，这与我们前面的分析结果一致。

第一行的这个语句有什么用？设置成sh和bash有什么区别？带着这些疑问，再来查看`man bash`：

> If the program is a file beginning with #!, the remainder of the first line specifies an interpreter for the program.

它表示这个文件的解释器，即用什么程序来打开此文件，就好比Windows上双击一个文件时会以什么程序打开一样。因为这里不是bash，而是sh，那么我们前面讨论的都不复有效了，真糟糕。我们来看看这个sh的路径：

{% highlight bash linenos %}
user@remote > ll `which sh`
lrwxrwxrwx 1 root root 9 Apr 25  2014 /usr/bin/sh -> /bin/bash
{% endhighlight %}

原来sh只是bash的一个软链接，既然如此，`BASH_ENV`应该是有效的啊，为何此处无效？还是回到`man bash`，同样在**INVOCATION**一节的下部看到了这样的说明：

> If bash is invoked with the name sh, it tries to mimic the startup behavior of historical versions of sh as closely as possible, while conforming to the POSIX standard as well. When invoked as an interactive login shell, or a non-interactive shell with the --login option, it first attempts to read and execute commands from /etc/profile and ~/.profile, in that order. The --noprofile option may be used to inhibit this behavior. When invoked as an interactive shell with the name sh, bash looks for the variable ENV, expands its value if it is defined, and uses the expanded value as the name of a file to read and execute. Since a shell invoked as sh does not attempt to read and execute commands from any other startup files, the --rcfile option has no effect. A non-interactive shell invoked with the name sh does not attempt to read any other startup files. When invoked as sh, bash enters posix mode after the startup files are read.

简而言之，当bash以是sh命启动时，即我们此处的情况，bash会尽可能的模仿sh，所以配置文件的加载变成了下面这样：

- interactive + login: 读取`/etc/profile`和`~/.profile`
- non-interactive + login: 同上
- interactive + non-login: 读取`ENV`环境变量对应的文件
- non-interactive + non-login: 不读取任何文件

这样便可以解释为什么出错了，因为这里属于non-interactive + non-login，所以bash不会读取任何文件，故而即使设置了`BASH_ENV`也不会起作用。所以为了解决问题，只需要把sh换成bash，再设置环境变量`BASH_ENV`即可。

另外，其实我们还可以设置参数到第一行的解释器中，如`#!/bin/bash --login`，如此一来，bash便会强制为login shell，所以`/etc/profile`也会被加载。相比上面那种方法，这种更为简单。

## 配置文件建议

回顾一下前面提到的所有配置文件，总共有以下几种：

- /etc/profile
- ~/.bash_profile
- ~/.bash_login
- ~/.profile
- /etc/bash.bashrc
- ~/.bashrc
- $BASH_ENV
- $ENV

不知你是否会有疑问，这么多的配置文件，究竟每个文件里面应该包含哪些配置，比如`PATH`应该在哪？提示符应该在哪配置？启动的程序应该在哪？等等。所以在文章的最后，我搜罗了一些最佳实践供各位参考。（这里只讨论属于用户个人的配置文件）

- `~/.bash_profile`：应该尽可能的简单，通常会在最后加载`.profile`和`.bashrc`(注意顺序)
- `~/.bash_login`：在前面讨论过，**别用它**
- `~/.profile`：此文件用于login shell，所有你想在整个用户会话期间都有效的内容都应该放置于此，比如启动进程，环境变量等
- `~/.bashrc`：只放置与bash有关的命令，所有与交互有关的命令都应该出现在此，比如bash的补全、alias、颜色、提示符等等。特别注意：**别在这里输出任何内容**（我们前面只是为了演示，别学我哈）

## 写在结尾

至此，我们详细的讨论完了bash的几种工作模式，并且给出了配置文件内容的建议。通过这些模式的介绍，本文开始遇到的问题也很容易的得到了解决。以前虽然一直使用bash，但真的不清楚里面包含了如此多的内容。同时感受到Linux的文档的确做得非常细致，在完全不需要其它安装包的情况下，你就可以得到一个非常完善的开发环境，这也曾是Eric S. Raymond在其著作《UNIX编程艺术》中提到的：UNIX天生是一个非常完善的开发机器。本文几乎所有的内容你都可以通过阅读man page得到。最后，希望在这样一个被妖魔化的特殊日子里，这篇文章能够为你带去一丝帮助。

(全文完)

feihu

2014.11.11 于 Shenzhen

