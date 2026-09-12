---
title: About Python
description: 本文整理了我使用和学习 Python 的过程中借鉴的博客，包括 Anaconda、PyCharm 等工具配置。
date: 2018-02-11 14:23:47
updated: 2024-02-20 22:46:01
tags:
  - 编程语言
categories:
  - Python
---

本文整理了我在使用和学习python的过程中借鉴的博客！
<!-- more -->
![](/2018/02/11/About%20python/python.png)

# 操作流程

## About Anaconda

1. 下载Anaconda<br>  进入[Conda](https://www.anaconda.com/distribution/#download-section)官网,点击`64-Bit Graphical Installer (462 MB)`等待下载
2. 安装<br>  点击已经下载好的安装包，`Destination Folder`选择自定义`Browse`文件夹（建议在D盘新建Conda文件夹）<br>剩余参考：https://jingyan.baidu.com/article/eae078275a31851fec5485b8.html
3. `Finish`之后不需要其他操作，关闭即可。

## About Pycharm

1. 下载Pycharm<br>  进入[Pychram](https://download.jetbrains.8686c.com/python/pycharm-professional-2018.3.3.exe)官网，选择`Professional`等待下载
2. 安装

- 自定义安装路径，方便存放自己的代码<br>  
- 勾选`64-bit launcher`、`.py`和`Add to ... the PATH`，点击`next`
- 直接`install`，结束

1. 剩余操作参考上面那个链接里面的（点击步骤4中的`Pychram`转到）（如果觉得麻烦，在下载的时候选择`Community`
2. 打开pychram<br>  选择`open`，打开你之前已经创建好了的文件夹，我的是`D:/Conda/Code`，然后点击左上角`file`找到里面的`setting`，进去之后选择`project`下面的`project Interpreter`，看到：![](/2018/02/11/About%20python/2.png)<br>  按如下操作：![](/2018/02/11/About%20python/3.png)![](/2018/02/11/About%20python/4.png)
3. 结束

## About VScode

- 人狠话不多，上菜！![](/2018/02/11/About%20python/vscode.png)

# 使用过程中的一些问题

## 问题1：安装相应的包很慢

### 问题描述：

  由于访问外网，python在加载包的时候很慢

### 解决方案：

  方法一：手动添加`conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/`
  方法二：windows下，直接在`user`目录中创建一个`pip`文件，如：`C:\Users\xx\pip`，新建文件`pip.ini`

```ini
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
```

## 问题2：jupyter更换虚拟环境

### 问题描述：

  在创建的conda env上运行Jupyter notebook，但是发现在notebook中的python其实并没有运行在那个env上。

### 解决方案：

1. 在`cmd`中切换到想要的环境xxx
2. 输入命令`conda activate xxx`
3. 在xxx环境中安装好`ipykernel`
4. `python -m ipykernel install --name xxx`（一般第三步操作完就可以了）

## 问题3：Linux环境下使用Jupyter

### 问题描述：

  linux远程使用jupyter notebook

### 解决方案：

```plain
jupyter notebook --allow-root --ip=
```

## 问题4：Pychram专业版破解

### 问题描述：

  专业版功能比较齐全，但是收费，破解感觉比较🐂🍺（社区版可以满足日常学习需求）

### 解决方案：

- 暂时性激活：[入口](http://lookdiv.com/) ,钥匙：lookdiv.com
- 永久激活： 下载Pychram2019:https://download.jetbrains.8686c.com/python/pycharm-professional-2018.3.3.exe
- 下载破解补丁链接：https://pan.baidu.com/s/1pr5Ri3SxUtpCDaSAUIpQQg
- 将破解补丁`JetbrainsCrack-release-enc.jar`放置在`pychram`安装目录`\bin`目录下面。
- 在`Pycharm`安装目录的\bin目录下找到`pycharm.exe.vmoptions`和`pycharm64.exe.vmoptions`两个文件 ，右键以文本格式打开（可用借助`Notepad`打开），在两个文件最后追加  `-javaagent:D:\RuanJian\PyCharm 2018.3.3\bin\JetbrainsCrack-release-enc.jar`，注意修改为你自己的安装路径，然后保存即可。
- 启动`pychram`,选择`Activation code`,输入以下内容。<pre>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br></pre><pre>   ThisCrackLicenseId-{<br>“licenseId”:”11011″,<br>“licenseeName”:”WeChat”,<br>“assigneeName”:”IT–Pig”,<br>“assigneeEmail”:”1113449881@qq.com”,<br>“licenseRestriction”:””,<br>“checkConcurrentUse”:false,<br>“products”:[<br>{“code”:”II”,”paidUpTo”:”2099-12-31″},<br>{“code”:”DM”,”paidUpTo”:”2099-12-31″},<br>{“code”:”AC”,”paidUpTo”:”2099-12-31″},<br>{“code”:”RS0″,”paidUpTo”:”2099-12-31″},<br>{“code”:”WS”,”paidUpTo”:”2099-12-31″},<br>{“code”:”DPN”,”paidUpTo”:”2099-12-31″},<br>{“code”:”RC”,”paidUpTo”:”2099-12-31″},<br>{“code”:”PS”,”paidUpTo”:”2099-12-31″},<br>{“code”:”DC”,”paidUpTo”:”2099-12-31″},<br>{“code”:”RM”,”paidUpTo”:”2099-12-31″},<br>{“code”:”CL”,”paidUpTo”:”2099-12-31″},<br>{“code”:”PC”,”paidUpTo”:”2099-12-31″}<br>],<br>“hash”:”2911276/0″,<br>“gracePeriodDays”:7,<br>“autoProlongated”:false}<br></pre>
