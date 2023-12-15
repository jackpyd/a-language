# 02 词法分析

词法分析：将程序从字符串转换为Token串的过程。

## 词法规则

用一则描述Token的词法，让程序基于词法规则处理。

词法规则：正则文法（上下文无法文法的子集）
语法规则：上下文无法文法

## 实现词法分析

提升性能的方法：

- 预读字符，缩小要匹配的范围

有限自动机：

- DFA：每个输入都发生一次确定的迁移
- NFA：一个输入可能会迁移到不止一个状态

任何一个NFA都可以通过一个算法转换成DFA

最佳实践：把标识符和关键字同意提取，然后再把关键字单独提取。

提升语法分析的效率。

## Run

```shell
tsc index.ts
node index.js your_filename 
```

output:

```shell
源代码：
function sayHello() {
    println("Hello Wolrd");
}

sayHello();

词法分析结果：
{ kind: 0, text: 'function' }
{ kind: 1, text: 'sayHello' }
{ kind: 3, text: '(' }
{ kind: 3, text: ')' }
{ kind: 3, text: '{' }
{ kind: 1, text: 'println' }
{ kind: 3, text: '(' }
{ kind: 2, text: 'Hello Wolrd' }
{ kind: 3, text: ')' }
{ kind: 3, text: ';' }
{ kind: 3, text: '}' }
{ kind: 1, text: 'sayHello' }
{ kind: 3, text: '(' }
{ kind: 3, text: ')' }
{ kind: 3, text: ';' }
success
success

语法分析后的AST：
Program
        FunctionDecl sayHello
                FunctionBody
                        FunctionCall println, not resolved
                                Parameter: Hello Wolrd
        FunctionCall sayHello, not resolved

语义分析后的AST，注意自定义函数的调用已被消解:
Program
        FunctionDecl sayHello
                FunctionBody
                        FunctionCall println, not resolved
                                Parameter: Hello Wolrd
        FunctionCall sayHello, resolved
当前运行的程序
Hello Wolrd
程序返回值：undefined
```