# 极简语言

## eBNF

eBNF语法：

```bnf
  prog: ( functionDecl | functionCall )*
  functionDecl: "function" Indetifier "("  ")" functionBody
  functionBody: "{" functionCal* "}"
  functionCall: Indentifier "(" parameterLists? ")"
  parameterLists: StringLiteral ( "," StringLiteral )*
```

## 目标

运行该程序：

- 声明一个名为sayHello的函数
- 调用sayHello函数，输出"Hello Wolrd"

```typescript
function sayHello() {
    println("Hello Wolrd");
}

sayHello();
```

该程序被简化为一个由token组成的数组：

```typescript
interface Token {
    kind: TokenKind,
    text: string
}

// 当前程序是由一系列Token组成的数组
let tokenArray: Token[] = [
    {kind: TokenKind.Keyword, text: 'function'},
    {kind: TokenKind.Identifier, text: 'sayHello'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: '{'},
    {kind: TokenKind.Identifier, text: 'println'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.StringLiteral, text: 'Hello World!'},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: ';'},
    {kind: TokenKind.Seperator, text: '}'},
    {kind: TokenKind.Identifier, text: 'sayHello'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: ';'},
    {kind: TokenKind.EOF, text: ''}
]
```

## 解析程序

解析：读入程序，并形成一个计算机可以理解的数据结构（如AST树）的过程，该过程由解析器完成。
解析器：读取一个Token串，并转换为一棵AST

### 语法分析

1. 写出语法规则
2. 根据语法规则，匹配子元素
3. 依次尝试一条语法规则的多个匹配

### 语义分析

引用消解：将函数的调用和函数的定义相关联

### 解释器

自顶向下、深度优先遍历AST
