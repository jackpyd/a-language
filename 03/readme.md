# 支持变量和类型

计算机语言的基本功能：

- 声明变量
- 对变量赋值
- 基于变量进行计算

## 语法分析

声明变量时，指定类型，有助于在编译器做类型检查。

语法规则：

```text
variableDecl: 'let' Identifier typeAnnotation? ( '=' singleExpression )
typeAnnotation: ':' typeName
expressionStatement: singleExpression ';'
singleExpression: assignment
assignment: binary ( AssignmentOp binary )*
binary: primary ( BinaryOp primary )*
```

语法分析算法：LL算法，计算First集和Follow集

First集合：预读Token为`let`
Fellow集合：处理变量名称后，查看后续的Token是否为冒号，
如果为冒号，就去解析类型注解，如果不为冒号，则直接略过

支持变量赋值语句：大多数语言将赋值运算看做加减乘除一样性质的运算。

赋值表达式是右结合的。

## 语义分析

### 引用消解

符号表：保存程序中的所有符号

每当遇到函数声明、变量声明，就把符号加到符号表中。

符号表保存的信息：

- 名称：变量名称、类名称和函数名称
- 符号种类：变量、函数、类
- 其他必要的信息：函数的签名、变量类型、类的成员

基于符号表做引用消解，需要对AST进行二次变量。

### 类型处理

检查类型是否匹配：属性计算，给AST节点添加一些属性，然后去计算另外节点的属性

> 对表达式求值的过程，可以看做属性计算的过程，属性即表达式的值

综合属性（Synthesized Attribute）：自上而下逐级计算得到的属性
继承属性（Inherited Attribute）：从父节点或兄弟节点计算出来的属性

当变量是赋值运算符的第一个节点时，它是左值

todo: 类型推导

## 解释器

增加map，保存变量的值

## coding

### 访问者模式

一种在LLVM项目源码中被广泛使用的设计模式。

简单实现：

- 语法树类提供某个方法接受访问者，并将自身引用传入访问者
- 访问者类中集成了根据语法树节点内容生成IR的规则。

解耦数据结构和操作。

实现步骤:

1. Visitor Object：访问者对象，拥有一个visit()方法
2. Receiving Object：接收对象，拥有一个 accept() 方法
3. visit(receivingObj)：用于Visitor接收一个Receiving Object
4. accept(visitor)：用于Receving Object接收一个Visitor，并通过调用Visitor的 visit() 为其提供获取 Receiving Object数据的能力

> 让访问者可以访问被访问者的方法
